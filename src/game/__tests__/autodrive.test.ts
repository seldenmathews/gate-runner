import { isAutodriveParam } from '../autodrive';

describe('isAutodriveParam', () => {
  it('accepts the query used by simulator QA', () => {
    expect(isAutodriveParam('1')).toBe(true);
    expect(isAutodriveParam(['1'])).toBe(true);
    expect(isAutodriveParam(undefined)).toBe(false);
    expect(isAutodriveParam('0')).toBe(false);
  });
});
