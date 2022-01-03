const store = {
    currentPage: 1,
    feeds: []
};
const router = new Router();
const newsFeedView = new NewsFeedView('root');
const newsDetailView = new NewsDetailView('root');
router.setDefaultPage(newsFeedView);
router.addRoutePath('/page/', newsFeedView);
router.addRoutePath('/show/', newsDetailView);
router.route();

//# sourceMappingURL=index.f19fcfcb.js.map
