import { beforeEach, describe, expect, it } from 'vitest';

import { ContentFilter } from './content-filter';

describe('Test LogFilter', () => {
  let logFilter: ContentFilter;

  beforeEach(() => {
    logFilter = new ContentFilter();
  });

  it('If all filter strings are empty, then always return true when filtering a string', () => {
    logFilter.setFilterStrings(['', '//', '&&', '&&&&', '/&&&&/']);
    expect(logFilter.lineFilter('12')).toEqual(true);
  });

  it('if one filter string is not empty, then return true when filter matches', () => {
    logFilter.setFilterStrings(['', '//', '&&', '&&&&', '//&&&&//', '123']);
    expect(logFilter.lineFilter('12')).toEqual(false);
    expect(logFilter.lineFilter('1234')).toEqual(true);
  });

  it('test regex filter', () => {
    logFilter.setFilterStrings(['/123/']);
    expect(logFilter.lineFilter('1234')).toEqual(true);
    expect(logFilter.lineFilter('12')).toEqual(false);
  });
  it('test complex regex filter', () => {
    logFilter.setFilterStrings(['/123|567/']);
    expect(logFilter.lineFilter('1234')).toEqual(true);
    expect(logFilter.lineFilter('5678')).toEqual(true);
    expect(logFilter.lineFilter('678')).toEqual(false);
  });
  it('test complex regex filter with and condition', () => {
    logFilter.setFilterStrings(['/123|567/&&abc']);
    expect(logFilter.lineFilter('1234abc')).toEqual(true);
    expect(logFilter.lineFilter('5678abc')).toEqual(true);
    expect(logFilter.lineFilter('5678bcd')).toEqual(false);
    expect(logFilter.lineFilter('678abc')).toEqual(false);
  });

  it('test simple filter', () => {
    logFilter.setFilterStrings(['123']);
    expect(logFilter.lineFilter('1234')).toEqual(true);
    expect(logFilter.lineFilter('12')).toEqual(false);
  });
  it('test simple filter with and condition', () => {
    logFilter.setFilterStrings(['123&&abc']);
    expect(logFilter.lineFilter('1234')).toEqual(false);
    expect(logFilter.lineFilter('1234abcd')).toEqual(true);
    expect(logFilter.lineFilter('1234bcd')).toEqual(false);
  });
});
