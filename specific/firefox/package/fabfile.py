"""
    Manages packaging, deplyment and testing of the navigation extension.
"""

import urllib2
import xml.etree.ElementTree as ET
import os, os.path
import json

from fabric.contrib import console
from fabric.api import task, local, lcd, hide
from fabric.utils import abort
from jinja2 import Environment, FileSystemLoader

import jsstrip

import sys
sys.path.append("..")

NAME = "Cliqz"
EXTENSION_ID = "{{id}}"
PATH_TO_EXTENSION_TEMP = EXTENSION_ID + "_temp"
PATH_TO_S3_BUCKET = "s3://cdncliqz/update/"
XML_EM_NAMESPACE = "http://www.mozilla.org/2004/em-rdf#"
AUTO_INSTALLER_URL = "http://localhost:8888/"


def get_folder_name(beta, channel):
    return channel + ('_beta' if beta else '')

def get_version(beta='True'):
    """Returns the extension's version string.

    The returned version will be constructed from the biggest version tag. If
    the beta argument is set to True the returned version will have a .1bN
    appended to the end, where N is the number of commits from last tag (e.g.
    0.4.08.1b123)."""

    full_version = local("git describe --tags", capture=True)  # e.g. 0.4.08-2-gb4f9f56
    # full_version = 'images'
    version_parts = full_version.split("-")

    with open('../package.json') as package_json_file:
        package_json = json.load(package_json_file)
        version = package_json['version']

    if beta == 'True':
        # If the number of commits after a tag is 0 the returned versions have
        # no dashes (e.g. 0.4.08)
        try:
            version = version + ".1b" + version_parts[1]
        except IndexError:
            version = version + ".1b0"
    return version


@task
def package(beta='True', version=None, sign='False', channel='browser', cert_path=None, cert_pass_path=None):
    """Package the extension as a .xpi file."""

    if not (beta == 'True') and version is not None:
        print 'WARNING: This will not take the %s tag from git. It packages the '\
              'commit that HEAD is pointing to.\n'\
              'If you want to package a specific tag check it out first with:\n'\
              'git checkout <tag>\n'\
              'or for latest tag just omit the version argument.' % version

    if not version:
        version = get_version(beta)

    folder = get_folder_name(beta=='True', channel)

    # Generate temporary manifest
    install_manifest_path = EXTENSION_ID + "/install.rdf"
    env = Environment(loader=FileSystemLoader('templates'))
    template = env.get_template('install.rdf')
    output_from_parsed_template = template.render(name=NAME,
                                                  version=version,
                                                  folder=folder,
                                                  beta=beta)
    with open(install_manifest_path, "wb") as f:
        f.write(output_from_parsed_template.encode("utf-8"))

    # Zip extension
    output_file_name = "%s.%s.xpi" % (NAME, version)
    local("cp -R %s %s" % (EXTENSION_ID, PATH_TO_EXTENSION_TEMP))

    with lcd(PATH_TO_EXTENSION_TEMP):  # We need to be inside the folder when using zip
        with hide('output'):
            exclude_files = "--exclude=*.DS_Store*"

            if channel == 'amo':
                # remove files which migth cause problems on AMO
                local("rm chrome/content/abtests.html")

            local("zip  %s ../%s -r *" % (exclude_files, output_file_name))
    local("rm -fr %s" % PATH_TO_EXTENSION_TEMP)

    if sign == 'True':
        local("mv %s UNSIGNED_%s" % (output_file_name, output_file_name))
        # signs the XPI with the Cliqz certificate

        if not cert_path:
            cert_path = '../certs/CliqzFrontend/xpisign-cliqz\@cliqz.com'

        if not cert_pass_path:
            cert_pass_path = '../certs/pass'

        # look for xpi-sign report on the same level as navigation-extension
        local( ("python ../xpi-sign/xpisign.py "
                "-k %s "
                "--signer openssl "
                "--passin file:%s "
                "UNSIGNED_%s %s ") % (cert_path, cert_pass_path, output_file_name, output_file_name))

    # creates a copy to the current build in case we need to upload it to S3
    local("cp %s latest.xpi" % output_file_name)

    return output_file_name

@task
def publish(beta='True', version=None, channel='browser', pre='True', cert_path=None, cert_pass_path=None):
    """Upload extension to s3 (credentials in ~/.s3cfg need to be set to primary)"""
    if not version:
        version = get_version(beta)

    update_manifest_file_name = "latest.rdf"
    latest_html_file_name = "latest.html"
    icon_name = "icon.png"
    output_file_name = package(beta, version, "True", channel, cert_path, cert_pass_path) # !!!! we must publish only signed versions !!!!
    icon_url = "http://cdn2.cliqz.com/update/%s" % icon_name

    folder = get_folder_name(beta=='True', channel)
    upload_folder = folder + ('_pre' if pre == 'True' else '')

    path_to_s3 = PATH_TO_S3_BUCKET + upload_folder + '/'

    local("aws s3 cp %s %s --acl public-read" % (output_file_name, path_to_s3))

    # upload an unpacked version also
    output_file_name_unpacked = output_file_name.replace('.xpi', '.unpacked.xpi')
    local("unzip %s -d %s" % (output_file_name, PATH_TO_EXTENSION_TEMP))
    with lcd(PATH_TO_EXTENSION_TEMP):
        local("zip -r0 ../%s -r *" % output_file_name_unpacked)
    local("aws s3 cp %s %s --acl public-read" % (output_file_name_unpacked, path_to_s3))

    local("cp %s latest.unpacked.xpi" % output_file_name_unpacked)
    local("aws s3 cp latest.unpacked.xpi %s --acl public-read" % path_to_s3)

    local("rm -fr %s" % PATH_TO_EXTENSION_TEMP)
    # end upload an unpacked version also

    env = Environment(loader=FileSystemLoader('templates'))
    manifest_template = env.get_template(update_manifest_file_name)

    download_link = "https://s3.amazonaws.com/cdncliqz/update/%s/%s" % (folder, output_file_name)
    upload_folder_link = "https://s3.amazonaws.com/cdncliqz/update/%s/%s" % (upload_folder, output_file_name)
    download_link_latest_html = "http://cdn2.cliqz.com/update/%s/%s" % (folder, output_file_name)

    output_from_parsed_template = manifest_template.render(version=version,
                                                           download_link=download_link)
    with open(update_manifest_file_name, "wb") as f:
        f.write(output_from_parsed_template.encode("utf-8"))
    local("aws s3 cp %s %s --acl public-read --content-type 'text/rdf'" % (update_manifest_file_name,
                                                          path_to_s3))
    local("rm  %s" % update_manifest_file_name)

    # Provide a link to the latest stable version
    latest_template = env.get_template(latest_html_file_name)
    output_from_parsed_template = latest_template.render(download_link=download_link_latest_html,
                                                         icon_url=icon_url)
    with open(latest_html_file_name, "wb") as f:
        f.write(output_from_parsed_template.encode("utf-8"))
    local("aws s3 cp %s %s --acl public-read" % (latest_html_file_name,
                                            path_to_s3))

    #replace latest.xpi when everything is done
    local("aws s3 cp latest.xpi %s --acl public-read" % path_to_s3)

    local("rm  %s" % latest_html_file_name)

    username = os.environ['BALROG_ADMIN']
    password = os.environ['BALROG_PASSWORD']

    if not username or not password:
        raise RuntimeError("Could not run without username or/and password")

    auth = (username, password)

    from fern.submitter import Submitter
    submitter = Submitter(
        release_name="SystemAddons-"+upload_folder,
        auth=auth,
        api_root="http://balrog-admin.10e99.net/api",
        addon_id="cliqz@cliqz.com",
        addon_version=version,
        addon_url=upload_folder_link
    )
    submitter.submit()
