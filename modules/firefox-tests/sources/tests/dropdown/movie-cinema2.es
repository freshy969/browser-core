/* global window */

import {
  blurUrlBar,
  $cliqzResults,
  click,
  CliqzUtils,
  expect,
  fillIn,
  respondWith,
  waitFor,
  waitForPopup,
  withHistory } from './helpers';
import results from './fixtures/resultsMovieCinema2';

export default function () {
  context('for a movie cinema 2 rich header', function () {
    const locale = CliqzUtils.locale.default || CliqzUtils.locale[window.navigator.language];
    const cinemaAreaSelector = 'div.movie-cinema';
    let $resultElement;
    let cinemaAreaItem;

    before(function () {
      blurUrlBar();
      respondWith({ results });
      withHistory([]);
      fillIn('yorck.de');
      window.preventRestarts = true;
      return waitForPopup().then(function () {
        $resultElement = $cliqzResults()[0];
        cinemaAreaItem = $resultElement.querySelector(cinemaAreaSelector);
      });
    });

    after(function () {
      window.preventRestarts = false;
    });

    describe('renders parent result', function () {
      let parentMovieItem;

      before(function () {
        parentMovieItem = $resultElement.querySelector(cinemaAreaSelector)
          .closest('div[class=""]').querySelector('a.result');
      });

      it('successfully', function () {
        expect(parentMovieItem).to.exist;
      });

      it('with an existing and correct title', function () {
        const parentMovieTitleSelector = 'div.abstract p span.title';
        const parentMovieTitleItem = parentMovieItem.querySelector(parentMovieTitleSelector);
        expect(parentMovieTitleItem).to.exist;
        expect(parentMovieTitleItem).to.have.text(results[0].snippet.title);
      });

      it('with an existing and correct domain', function () {
        const parentMovieDomainSelector = 'div.abstract p span.url';
        const parentMovieDomainItem = parentMovieItem.querySelector(parentMovieDomainSelector);
        expect(parentMovieDomainItem).to.exist;
        expect(parentMovieDomainItem).to.have.text(results[0].snippet.friendlyUrl);
      });

      it('with an existing and correct link', function () {
        const parentMovieLinkItem = parentMovieItem.dataset.url;
        expect(parentMovieLinkItem).to.exist;
        expect(parentMovieLinkItem).to.equal(results[0].url);
      });

      it('with an existing and correct description', function () {
        const parentMovieDescSelector = 'div.abstract p span.description';
        const parentMovieDescItem = parentMovieItem.querySelector(parentMovieDescSelector);
        expect(parentMovieDescItem).to.exist;
        expect(parentMovieDescItem).to.have.text(results[0].snippet.description);
      });

      it('with an existing icon', function () {
        const parentMovieIconSelector = 'div.icons span.logo';
        const parentMovieIconItem = parentMovieItem.querySelector(parentMovieIconSelector);
        expect(parentMovieIconItem).to.exist;
      });
    });

    describe('renders cinema map info', function () {
      const cinemaLocalSelector = 'div.local-result-wrapper';
      const cinemaAddressSelector = 'div.local-address';
      let cinemaLocalItem;
      let cinemaAddressItem;

      before(function () {
        cinemaLocalItem = cinemaAreaItem.querySelector(cinemaLocalSelector);
        cinemaAddressItem = cinemaAreaItem.querySelector(cinemaAddressSelector);
      });

      it('successfully', function () {
        expect(cinemaLocalItem).to.exist;
      });

      it('with existing map icon with correct URL', function () {
        const cinemaMapSelector = 'a.local-map';
        const cinemaMapItem = cinemaLocalItem.querySelector(cinemaMapSelector);
        expect(cinemaMapItem).to.exist;
        expect(decodeURIComponent(cinemaMapItem.dataset.url))
          .to.equal(results[0].snippet.extra.data.cinema.mu);
      });

      it('with existing and correct address', function () {
        expect(cinemaAddressItem).to.exist;
        expect(cinemaAddressItem)
          .to.contain.text(results[0].snippet.extra.data.cinema.address);
      });

      it('with existing and correct distance', function () {
        const distance = (results[0].snippet.extra.data.cinema.distance / 1000).toFixed(1);
        expect(cinemaAddressItem).to.contain.text(distance);
      });

      it('with existing and correct phone number', function () {
        const cinemaPhoneSelector = 'div.local-phone';
        const cinemaPhoneItem = cinemaAreaItem.querySelector(cinemaPhoneSelector);
        expect(cinemaPhoneItem)
          .to.contain.text(results[0].snippet.extra.data.cinema.phonenumber);
      });
    });

    describe('renders cinema and movies table', function () {
      const cinemaMoviesSelector = 'div.show-time';
      const moviesRowSelector = '#tab-block-0 .show-time-row';
      const movieTimeSelector = '#tab-block-0 .show-time-span';
      let cinemaMoviesItem;
      let moviesRowItems;
      let movieTimes;

      before(function () {
        cinemaMoviesItem = cinemaAreaItem.querySelector(cinemaMoviesSelector);
        moviesRowItems = cinemaMoviesItem.querySelectorAll(moviesRowSelector);
      });

      it('with existing and correct location info', function () {
        const locationInfoSelector = 'div.title span';
        const locationInfoItem = cinemaMoviesItem.querySelectorAll(locationInfoSelector);
        expect(locationInfoItem[0]).to.contain.text(locale['cinema-movie-showtimes'].message);
        expect(locationInfoItem[0])
          .to.contain.text(results[0].snippet.extra.data.cinema.name);
        expect(locationInfoItem[1].querySelector('span.location-icon')).to.exist;
        expect(locationInfoItem[1]).to.contain.text(results[0].snippet.extra.data.city);
      });

      it('with existing and correct table tabs', function () {
        const moviesTabsAreaSelector = 'div.dropdown-tabs';
        const moviesTabsAreaItem = cinemaMoviesItem.querySelector(moviesTabsAreaSelector);
        expect(moviesTabsAreaItem).to.exist;

        const moviesTabsSelector = 'label.dropdown-tab';
        const moviesTabsItems = moviesTabsAreaItem.querySelectorAll(moviesTabsSelector);
        expect(moviesTabsItems.length)
          .to.equal(results[0].snippet.extra.data.showdates.length);
        [...moviesTabsItems].forEach(function (tab, i) {
          expect(tab).to.have.text(results[0].snippet.extra.data.showdates[i].date);
        });
      });

      it('with the first tab being selected as default', function () {
        const inputTabSelector = '.dropdown-tab';
        const inputTabItems = cinemaMoviesItem.querySelectorAll(inputTabSelector);
        const [
          firstTabItem,
          ...remainingTabItems
        ] = inputTabItems;
        expect(firstTabItem.classList.contains('checked')).to.be.true;
        [...remainingTabItems].forEach(function (tab) {
          expect(tab.classList.contains('checked')).to.be.false;
        });
      });

      it('with correct amount of movies', function () {
        expect(moviesRowItems.length).to.equal(2);
      });

      it('with correct movies names', function () {
        const movieNameSelector = '#tab-block-0 .cinema-info span';
        [...moviesRowItems].forEach(function (movie, i) {
          const movieInfo = movie.querySelector(movieNameSelector);
          expect(movieInfo)
            .to.have.text(results[0].snippet.extra.data.showdates[0].movie_list[i].title);
        });
      });

      it('with correct amount of movie hours', function () {
        [...moviesRowItems].forEach(function (movie, i) {
          movieTimes = movie.querySelectorAll(movieTimeSelector);
          expect(movieTimes.length)
            .to.equal(results[0].snippet.extra.data.showdates[0].movie_list[i].showtimes.length);
        });
      });

      it('with correct movies booking URLs', function () {
        [...moviesRowItems].forEach(function (movie, i) {
          movieTimes = movie.querySelectorAll(movieTimeSelector);
          [...movieTimes].forEach(function (time, j) {
            expect(time.querySelector('a').dataset.url)
              .to.equal(results[0].snippet.extra.data.showdates[0]
                .movie_list[i].showtimes[j].booking_link);
          });
        });
      });

      it('with existing and correct "Show more" item', function () {
        const showMoreSelector = 'a.expand-btn';
        const showMoreItem = cinemaMoviesItem.querySelector(showMoreSelector);
        expect(showMoreItem).to.exist;
        expect(showMoreItem).to.have.trimmed.text(locale['cinema-expand-button'].message);
        expect(showMoreItem.dataset.url).to.exist;
      });
    });
  });

  context('for a movie cinema 2 rich header expand table', function () {
    const locale = CliqzUtils.locale.default || CliqzUtils.locale[window.navigator.language];
    const cinemaAreaSelector = 'div.movie-cinema';
    let $resultElement;
    let cinemaAreaItem;

    before(function () {
      blurUrlBar();
      respondWith({ results });
      withHistory([]);
      fillIn('yorck.de');
      window.preventRestarts = true;
      return waitForPopup().then(function () {
        $resultElement = $cliqzResults()[0];
      }).then(function () {
        click($resultElement.querySelector('.result.expand-btn'));

        return waitFor(function () {
          return $resultElement.querySelectorAll('div.show-time-row').length > 2;
        }).then(function () {
          cinemaAreaItem = $resultElement.querySelector(cinemaAreaSelector);
        });
      });
    });

    describe('renders cinema and movies table', function () {
      const cinemaMoviesSelector = 'div.show-time';
      const moviesRowSelector = '#tab-block-0 .show-time-row';
      const movieTimeSelector = '#tab-block-0 .show-time-span';
      let cinemaMoviesItem;
      let moviesRowItems;
      let movieTimes;

      before(function () {
        cinemaMoviesItem = cinemaAreaItem.querySelector(cinemaMoviesSelector);
        moviesRowItems = cinemaMoviesItem.querySelectorAll(moviesRowSelector);
      });

      it('with existing and correct location info', function () {
        const locationInfoSelector = 'div.title span';
        const locationInfoItem = cinemaMoviesItem.querySelectorAll(locationInfoSelector);
        expect(locationInfoItem[0]).to.contain.text(locale['cinema-movie-showtimes'].message);
        expect(locationInfoItem[0])
          .to.contain.text(results[0].snippet.extra.data.cinema.name);
        expect(locationInfoItem[1].querySelector('span.location-icon')).to.exist;
        expect(locationInfoItem[1]).to.contain.text(results[0].snippet.extra.data.city);
      });

      it('with existing and correct table tabs', function () {
        const moviesTabsAreaSelector = 'div.dropdown-tabs';
        const moviesTabsAreaItem = cinemaMoviesItem.querySelector(moviesTabsAreaSelector);
        expect(moviesTabsAreaItem).to.exist;

        const moviesTabsSelector = 'label.dropdown-tab';
        const moviesTabsItems = moviesTabsAreaItem.querySelectorAll(moviesTabsSelector);
        expect(moviesTabsItems.length)
          .to.equal(results[0].snippet.extra.data.showdates.length);
        [...moviesTabsItems].forEach(function (tab, i) {
          expect(tab).to.have.text(results[0].snippet.extra.data.showdates[i].date);
        });
      });

      it('with the first tab being selected as default', function () {
        const inputTabSelector = '#tab-0.dropdown-tab';
        const inputTabItems = cinemaMoviesItem.querySelectorAll(inputTabSelector);
        const [
          firstTabItem,
          ...remainingTabItems
        ] = inputTabItems;
        expect(firstTabItem.classList.contains('checked')).to.be.true;
        [...remainingTabItems].forEach(function (tab) {
          expect(tab.classList.contains('checked')).to.be.false;
        });
      });

      it('with correct expanded amount of movies', function () {
        expect(moviesRowItems.length)
          .to.equal(results[0].snippet.extra.data.showdates[0].movie_list.length);
      });

      it('with correct movies names', function () {
        const movieNameSelector = 'div.cinema-info span';
        [...moviesRowItems].forEach(function (movie, i) {
          const movieInfo = movie.querySelector(movieNameSelector);
          expect(movieInfo)
            .to.have.text(results[0].snippet.extra.data.showdates[0].movie_list[i].title);
        });
      });

      it('with correct amount of movie hours', function () {
        [...moviesRowItems].forEach(function (movie, i) {
          movieTimes = movie.querySelectorAll(movieTimeSelector);
          expect(movieTimes.length)
            .to.equal(results[0].snippet.extra.data.showdates[0].movie_list[i].showtimes.length);
        });
      });

      it('with correct movies booking URLs', function () {
        [...moviesRowItems].forEach(function (movie, i) {
          movieTimes = movie.querySelectorAll(movieTimeSelector);
          [...movieTimes].forEach(function (time, j) {
            expect(time.querySelector('a').dataset.url)
              .to.equal(results[0].snippet.extra.data.showdates[0]
                .movie_list[i].showtimes[j].booking_link);
          });
        });
      });

      it('doesn\'t render "Show more" link', function () {
        const showMoreSelector = '.result.expand-btn';
        expect($resultElement.querySelector(showMoreSelector)).to.not.exist;
      });
    });
  });

  context('for a movie cinema 2 rich header changing day', function () {
    const locale = CliqzUtils.locale.default || CliqzUtils.locale[window.navigator.language];
    const cinemaAreaSelector = 'div.movie-cinema';
    let $resultElement;
    let cinemaAreaItem;

    before(function () {
      blurUrlBar();
      respondWith({ results });
      withHistory([]);
      fillIn('yorck.de');
      window.preventRestarts = true;
      return waitForPopup().then(function () {
        $resultElement = $cliqzResults()[0];
      }).then(function () {
        $resultElement.querySelector('#tab-1.dropdown-tab').click();
        return waitFor(function () {
          return $resultElement.querySelector('#tab-0.dropdown-tab').classList.contains('checked') === false;
        }).then(function () {
          cinemaAreaItem = $resultElement.querySelector(cinemaAreaSelector);
        });
      });
    });

    describe('renders cinema and movies table', function () {
      const cinemaMoviesSelector = 'div.show-time';
      const moviesRowSelector = '#tab-block-1 .show-time-row';
      const movieTimeSelector = '#tab-block-1 .show-time-span';
      let cinemaMoviesItem;
      let moviesRowItems;
      let movieTimes;

      before(function () {
        cinemaMoviesItem = cinemaAreaItem.querySelector(cinemaMoviesSelector);
        moviesRowItems = cinemaMoviesItem.querySelectorAll(moviesRowSelector);
      });

      it('with existing and correct location info', function () {
        const locationInfoSelector = 'div.title span';
        const locationInfoItem = cinemaMoviesItem.querySelectorAll(locationInfoSelector);
        expect(locationInfoItem[0]).to.contain.text(locale['cinema-movie-showtimes'].message);
        expect(locationInfoItem[0])
          .to.contain.text(results[0].snippet.extra.data.cinema.name);
        expect(locationInfoItem[1].querySelector('span.location-icon')).to.exist;
        expect(locationInfoItem[1]).to.contain.text(results[0].snippet.extra.data.city);
      });

      it('with existing and correct table tabs', function () {
        const moviesTabsAreaSelector = 'div.dropdown-tabs';
        const moviesTabsAreaItem = cinemaMoviesItem.querySelector(moviesTabsAreaSelector);
        expect(moviesTabsAreaItem).to.exist;

        const moviesTabsSelector = 'label.dropdown-tab';
        const moviesTabsItems = moviesTabsAreaItem.querySelectorAll(moviesTabsSelector);
        expect(moviesTabsItems.length)
          .to.equal(results[0].snippet.extra.data.showdates.length);
        [...moviesTabsItems].forEach(function (tab, i) {
          expect(tab).to.have.text(results[0].snippet.extra.data.showdates[i].date);
        });
      });

      it('with the second tab being selected', function () {
        const inputTabSelector = '#tab-1.dropdown-tab';
        const inputTabItems = cinemaMoviesItem.querySelectorAll(inputTabSelector);
        const [
          secondTabItem,
          ...remainingTabItems
        ] = inputTabItems;
        expect(secondTabItem.classList.contains('checked')).to.be.true;
        [...remainingTabItems].forEach(function (tab) {
          expect(tab.classList.contains('checked')).to.be.false;
        });
      });

      it('with correct expanded amount of movies', function () {
        expect(moviesRowItems.length).to.equal(2);
      });

      it('with correct movies names', function () {
        const movieNameSelector = 'div.cinema-info span';
        [...moviesRowItems].forEach(function (movie, i) {
          const movieInfo = movie.querySelector(movieNameSelector);
          expect(movieInfo)
            .to.have.text(results[0].snippet.extra.data.showdates[1].movie_list[i].title);
        });
      });

      it('with correct amount of movie hours', function () {
        [...moviesRowItems].forEach(function (movie, i) {
          movieTimes = movie.querySelectorAll(movieTimeSelector);
          expect(movieTimes.length)
            .to.equal(results[0].snippet.extra.data.showdates[1].movie_list[i].showtimes.length);
        });
      });

      it('with correct movies booking URLs', function () {
        [...moviesRowItems].forEach(function (movie, i) {
          movieTimes = movie.querySelectorAll(movieTimeSelector);
          [...movieTimes].forEach(function (time, j) {
            expect(time.querySelector('a').dataset.url)
              .to.equal(results[0].snippet.extra.data.showdates[0]
                .movie_list[i].showtimes[j].booking_link);
          });
        });
      });

      it('render "Show more" link', function () {
        const showMoreSelector = '.result.expand-btn';
        expect($resultElement.querySelector(showMoreSelector)).to.exist;
      });
    });
  });
}
