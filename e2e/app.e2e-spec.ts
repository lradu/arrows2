import { Arrows2Page } from './app.po';

describe('arrows2 App', function() {
  let page: Arrows2Page;

  beforeEach(() => {
    page = new Arrows2Page();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
