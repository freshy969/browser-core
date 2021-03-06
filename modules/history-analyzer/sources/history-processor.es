import History from '../platform/history/history';
import moment from '../platform/lib/moment';

import EventEmitter from '../core/event-emitter';
import PersistentMap from '../core/persistence/map';
import setTimeoutInterval from '../core/helpers/timeout';
import { compactTokens } from '../core/pattern-matching';

import tokenize, { SECOND, HOUR } from './utils';
import logger from './logger';

// 90 days of 24 hours
const MAX_HOUR_BUCKETS = 24 * 90;


function fetchHistoryForDate(timestamp) {
  // timestamp is always the end of the hourly bucket
  return History.queryVisitsForTimespan({
    frameStartsAt: (timestamp - HOUR) * 1000,
    frameEndsAt: timestamp * 1000,
  });
}


/**
 * Async processing of the existing history, day by day.
 * This simulates the API of a worker, so it would be easy to migrate if needed.
 */
export default class HistoryProcessor extends EventEmitter {
  constructor() {
    super(['processedVisits']);

    this.processedHours = new PersistentMap('history-analyzer-processor');
    this.processInterval = null;
  }

  init() {
    return this.processedHours.init()
      .then(() => this.processedHours.keys())
      .then((timestamps) => {
        // If we already processed the maximum number of hours we do nothing.
        if (timestamps.length >= MAX_HOUR_BUCKETS) {
          return;
        }

        // Sort timestamps (oldest timestamp should be in first position)
        timestamps.sort();

        // Get oldest timestamp, or `now` if we did not process anything before.
        const oldestTs = timestamps.length === 0 ? Date.now() : timestamps[0];
        const numberOfBucketsToProcess = MAX_HOUR_BUCKETS - timestamps.length;

        // List hours to process (each timestamp is the end of a hourly bucket)
        const hoursToProcess = [];
        for (let i = 0; i < numberOfBucketsToProcess; i += 1) {
          hoursToProcess.push(oldestTs - (i * HOUR));
        }
        // Result should be of the form.
        // [ t0, t1, t2, ..., tN]
        //   ^   ^   ^
        //   |   |   | two hours before t0
        //   |   | one hour before t0
        //   | oldest date processed so far (or Date.now())
        //
        // Which means that history will be processed in the following way:
        // 1. hour [t0 - 1h, t0]
        // 2. hour [t1 - 1h, t1]
        // 3. etc.
        // From most recent to oldest.

        logger.log(
          'History processor start. Following hours will be processed',
          hoursToProcess.map(ts => moment(ts).format('YYYY-MM-DD h:mm:ss a')),
        );

        // Start processing one bucket at a time.
        let processing = false;
        this.processInterval = setTimeoutInterval(
          () => {
            if (hoursToProcess.length <= 0) {
              // Stop interval if there is nothing more to process
              this.processInterval.stop();
              this.processInterval = null;
            } else if (!processing) {
              processing = true;

              try {
                this.processDate(hoursToProcess.shift())
                  .then(() => { processing = false; })
                  .catch(() => { processing = false; });
              } catch (ex) { processing = false; }
            }
          },
          3 * SECOND, // Process one hour of history every 2 second
        );
      });
  }

  unload() {
    if (this.processInterval) {
      this.processInterval.stop();
      this.processInterval = null;
    }
    this.processedHours.unload();
  }

  destroy() {
    return this.processedHours.destroy();
  }

  processDate(timestamp) {
    return fetchHistoryForDate(timestamp).then((places) => {
      const t0 = Date.now();
      const processedUrls = places.map(({ ts, url }) => ({
        ts,
        url,
        tokens: compactTokens(tokenize(url)),
      }));
      const total = Date.now() - t0;

      logger.debug('Processing time', {
        ts: timestamp,
        urls: places.length,
        time: total,
      });

      this.emit('processedVisits', processedUrls);
      return this.processedHours.set(timestamp, {});
    });
  }
}
