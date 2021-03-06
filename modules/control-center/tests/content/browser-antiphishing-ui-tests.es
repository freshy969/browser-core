import {
  clearIntervals,
  expect
} from '../../core/test-helpers';
import Subject from './local-helpers';
import { generateDataOn, generateDataOffSite, generateDataOffAll } from './fixtures/antiphishing';

function antiphishingUiTests(amo) {
  const dataOn = generateDataOn(amo);
  const dataOffSite = generateDataOffSite(amo);
  const dataOffAll = generateDataOffAll(amo);
  const target = 'cliqz-control-center';
  let subject;

  before(function () {
    subject = new Subject();
    return subject.load();
  });

  after(function () {
    subject.unload();
    clearIntervals();
  });

  function headerProtected() {
    context('control center header', function () {
      it('renders header', function () {
        expect(subject.query('#header')).to.exist;
      });

      it('renders cliqz logo', function () {
        expect(subject.query('#header .pause img')).to.exist;
        expect(subject.getComputedStyle('#header .pause img').display).to.not.equal('none');
        expect(subject.query('#header .pause img').getAttribute('src')).to.equal('./images/cliqz.svg');
      });

      it('renders "Your data is protected"', function () {
        expect(subject.query('#header .title [data-i18n="control-center-txt-header"]')).to.exist;
        expect(subject.getComputedStyle('#header .title [data-i18n="control-center-txt-header"]').display).to.not.equal('none');
        expect(subject.getComputedStyle('#header .title [data-i18n="control-center-txt-header-not"][data-visible-on-state="inactive"]').display).to.equal('none');
        expect(subject.getComputedStyle('#header .title [data-i18n="control-center-txt-header-not"][data-visible-on-state="critical"]').display).to.equal('none');
        expect(subject.query('#header .title [data-i18n="control-center-txt-header"]').textContent.trim()).to.equal('control-center-txt-header');
      });

      it('doesn\'t render warning icon', function () {
        expect(subject.query('#header .title img')).to.exist;
        expect(subject.getComputedStyle('#header .title img').display).to.equal('none');
      });
    });
  }

  function antiPhishingUiTests() {
    it('renders antiphishing box', function () {
      expect(subject.query('#anti-phising')).to.not.be.null;
    });

    it('renders info button', function () {
      expect(subject.query('#anti-phising .title .infobutton')).to.exist;
    });

    it('renders title', function () {
      expect(subject.query('#anti-phising .title>span')).to.exist;
      expect(subject.query('#anti-phising .title>span').textContent.trim()).to.equal('Anti-Phishing');
    });

    it('renders switch', function () {
      expect(subject.query('#anti-phising .title .switches .cqz-switch-box')).to.exist;
    });
  }

  describe('anti-phishing on', function () {
    before(function () {
      return subject.pushData(target, dataOn);
    });

    headerProtected();
    antiPhishingUiTests();

    it('dropdown is invisible', function () {
      expect(subject.query('#anti-phising .new-dropdown .dropdown-btn')).to.exist;
      expect(subject.getComputedStyle('#anti-phising .new-dropdown .dropdown-btn').display).to.equal('none');
    });

    it('renders correct colour of switch', function () {
      expect(subject.getComputedStyle('#anti-phising .switches .cqz-switch-box').background).to.contain('rgb(0, 173, 239)');
    });

    it('renders "ON"', function () {
      expect(subject.query('#anti-phising .switches [data-visible-on-state="active"][data-i18n="control-center-switch-on"]')).to.exist;
      expect(subject.getComputedStyle('#anti-phising .switches [data-visible-on-state="active"][data-i18n="control-center-switch-on"]').display).to.not.equal('none');
      expect(subject.query('#anti-phising .switches [data-invisible-on-state="active"][data-i18n="control-center-switch-off"]')).to.exist;
      expect(subject.getComputedStyle('#anti-phising .switches [data-invisible-on-state="active"][data-i18n="control-center-switch-off"]').display).to.equal('none');
      expect(subject.query('#anti-phising .switches [data-visible-on-state="active"][data-i18n="control-center-switch-on"]').textContent.trim()).to.equal('control-center-switch-on');
    });
  });

  describe('anti-phishing off for particular domain', function () {
    before(function () {
      return subject.pushData(target, dataOffSite);
    });

    headerProtected();
    antiPhishingUiTests();

    it('renders correct colour of switch', function () {
      expect(subject.getComputedStyle('#anti-phising .switches .cqz-switch-box').background).to.contain('rgb(255, 126, 116)');
    });

    it('renders "OFF"', function () {
      expect(subject.query('#anti-phising .switches [data-visible-on-state="active"][data-i18n="control-center-switch-on"]')).to.exist;
      expect(subject.getComputedStyle('#anti-phising .switches [data-visible-on-state="active"][data-i18n="control-center-switch-on"]').display).to.equal('none');
      expect(subject.query('#anti-phising .switches [data-invisible-on-state="active"][data-i18n="control-center-switch-off"]')).to.exist;
      expect(subject.getComputedStyle('#anti-phising .switches [data-invisible-on-state="active"][data-i18n="control-center-switch-off"]').display).to.not.equal('none');
      expect(subject.query('#anti-phising .switches [data-invisible-on-state="active"][data-i18n="control-center-switch-off"]').textContent.trim()).to.equal('control-center-switch-off');
    });

    it('renders dropdown with "This domain"', function () {
      expect(subject.query('#anti-phising .new-dropdown .dropdown-btn [data-visible-on-state="inactive"][data-i18n="control-center-this-domain"]')).to.exist;
      expect(subject.getComputedStyle('#anti-phising .new-dropdown .dropdown-btn [data-visible-on-state="inactive"][data-i18n="control-center-this-domain"]').display).to.not.equal('none');
      expect(subject.query('#anti-phising .new-dropdown .dropdown-btn [data-visible-on-state="critical"][data-i18n="control-center-all-sites"]')).to.exist;
      expect(subject.getComputedStyle('#anti-phising .new-dropdown .dropdown-btn [data-visible-on-state="critical"][data-i18n="control-center-all-sites"]').display).to.equal('none');
      expect(subject.query('#anti-phising .new-dropdown .dropdown-btn [data-visible-on-state="inactive"][data-i18n="control-center-this-domain"]').textContent.trim()).to.equal('control-center-this-domain');
    });
  });

  describe('anti-phishing off for all websites', function () {
    before(function () {
      return subject.pushData(target, dataOffAll);
    });

    headerProtected();
    antiPhishingUiTests();

    it('renders correct colour of switch', function () {
      expect(subject.getComputedStyle('#anti-phising .switches .cqz-switch-box').background).to.contain('rgb(255, 126, 116)');
    });

    it('renders "OFF"', function () {
      expect(subject.query('#anti-phising .switches [data-visible-on-state="active"][data-i18n="control-center-switch-on"]')).to.exist;
      expect(subject.getComputedStyle('#anti-phising .switches [data-visible-on-state="active"][data-i18n="control-center-switch-on"]').display).to.equal('none');
      expect(subject.query('#anti-phising .switches [data-invisible-on-state="active"][data-i18n="control-center-switch-off"]')).to.exist;
      expect(subject.getComputedStyle('#anti-phising .switches [data-invisible-on-state="active"][data-i18n="control-center-switch-off"]').display).to.not.equal('none');
      expect(subject.query('#anti-phising .switches [data-invisible-on-state="active"][data-i18n="control-center-switch-off"]').textContent.trim()).to.equal('control-center-switch-off');
    });

    it('renders dropdown with "All websites"', function () {
      expect(subject.query('#anti-phising .new-dropdown .dropdown-btn [data-visible-on-state="inactive"][data-i18n="control-center-this-domain"]')).to.exist;
      expect(subject.getComputedStyle('#anti-phising .new-dropdown .dropdown-btn [data-visible-on-state="inactive"][data-i18n="control-center-this-domain"]').display).to.equal('none');
      expect(subject.query('#anti-phising .new-dropdown .dropdown-btn [data-visible-on-state="critical"][data-i18n="control-center-all-sites"]')).to.exist;
      expect(subject.getComputedStyle('#anti-phising .new-dropdown .dropdown-btn [data-visible-on-state="critical"][data-i18n="control-center-all-sites"]').display).to.not.equal('none');
      expect(subject.query('#anti-phising .new-dropdown .dropdown-btn [data-visible-on-state="critical"][data-i18n="control-center-all-sites"]').textContent.trim()).to.equal('control-center-all-sites');
    });
  });
}

describe('Control Center: Anti-Phishing UI browser', function () {
  antiphishingUiTests(false);
});

describe('Control Center: AMO, Anti-Phishing UI tests', function () {
  antiphishingUiTests(true);
});
