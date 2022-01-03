const NEWS_URL = 'https://api.hnpwa.com/v0/news/1.json';
const CONTENT_URL = 'https://api.hnpwa.com/v0/item/@id.json';
const store = {
    currentPage: 1,
    feeds: []
};
class Api {
    constructor(url){
        this.ajax = new XMLHttpRequest();
        this.url = url;
    }
    getRequest() {
        this.ajax.open('GET', this.url, false);
        this.ajax.send();
        return JSON.parse(this.ajax.response);
    }
}
class NewsFeedApi extends Api {
    getData() {
        return this.getRequest();
    }
}
class NewsDetailApi extends Api {
    getData() {
        return this.getRequest();
    }
}
class View {
    constructor(containerId, template){
        const containerElement = document.getElementById(containerId);
        if (!containerElement) throw '최상위 컨테이너가 없어 UI를 진행하지 못합니다.';
        this.container = containerElement;
        this.template = template;
        this.renderTemplate = template;
        this.htmlList = [];
    }
    updateView() {
        this.container.innerHTML = this.renderTemplate;
        this.renderTemplate = this.template;
    }
    addHtml(htmlString) {
        this.htmlList.push(htmlString);
    }
    getHtml() {
        const snapshot = this.htmlList.join('');
        this.clearHtmlList();
        return snapshot;
    }
    setTemplateData(key, value) {
        this.renderTemplate = this.renderTemplate.replace(`{{__${key}__}}`, value);
    }
    clearHtmlList() {
        this.htmlList = [];
    }
}
class Router {
    constructor(){
        window.addEventListener('hashchange', this.route.bind(this));
        this.routeTable = [];
        this.defaultRoute = null;
    }
    setDefaultPage(page) {
        this.defaultRoute = {
            path: '',
            page
        };
    }
    addRoutePath(path, page1) {
        this.routeTable.push({
            path,
            page: page1
        });
    }
    route() {
        const routePath = location.hash;
        if (routePath === '' && this.defaultRoute) this.defaultRoute.page.render();
        for (const routeInfo of this.routeTable)if (routePath.indexOf(routeInfo.path) >= 0) {
            routeInfo.page.render();
            break;
        }
    }
}
class NewsFeedView extends View {
    constructor(containerId1){
        let template = `
      <div class="bg-gray-600 min-h-screen">
        <div class="bg-white text-xl">
          <div class="mx-auto px-4">
            <div class="flex justify-between items-center py-6">
              <div class="flex justify-start">
                <h1 class="font-extrabold">Hacker News</h1>
              </div>
              <div class="items-center justify-end">
                <a href="#/page/{{__prev_page__}}" class="text-gray-500">
                  Previous
                </a>
                <a href="#/page/{{__next_page__}}" class="text-gray-500 ml-4">
                  Next
                </a>
              </div>
            </div> 
          </div>
        </div>
        <div class="p-4 text-2xl text-gray-700">
          {{__news_feed__}}        
        </div>
      </div>
    `;
        super(containerId1, template);
        this.api = new NewsFeedApi(NEWS_URL);
        this.feeds = store.feeds;
        if (this.feeds.length === 0) {
            this.feeds = store.feeds = this.api.getData();
            this.makeFeeds();
        }
    }
    render() {
        store.currentPage = Number(location.hash.substr(7) || 1);
        for(let i = (store.currentPage - 1) * 10; i < store.currentPage * 10; i++){
            const { id , title , comments_count , user , points , time_ago , read  } = this.feeds[i];
            this.addHtml(`
        <div class="p-6 ${read ? 'bg-red-500' : 'bg-white'} mt-6 rounded-lg shadow-md transition-colors duration-500 hover:bg-green-100">
          <div class="flex">
            <div class="flex-auto">
              <a href="#/show/${id}">${title}</a>  
            </div>
            <div class="text-center text-sm">
              <div class="w-10 text-white bg-green-300 rounded-lg px-0 py-2">${comments_count}</div>
            </div>
          </div>
          <div class="flex mt-3">
            <div class="grid grid-cols-3 text-sm text-gray-500">
              <div><i class="fas fa-user mr-1"></i>${user}</div>
              <div><i class="fas fa-heart mr-1"></i>${points}</div>
              <div><i class="far fa-clock mr-1"></i>${time_ago}</div>
            </div>  
          </div>
        </div>    
      `);
        }
        this.setTemplateData('news_feed', this.getHtml());
        this.setTemplateData('prev_page', String(store.currentPage > 1 ? store.currentPage - 1 : 1));
        this.setTemplateData('next_page', String(store.currentPage + 1));
        this.updateView();
    }
    makeFeeds() {
        for(let i = 0; i < this.feeds.length; i++)this.feeds[i].read = false;
    }
}
class NewsDetailView extends View {
    constructor(containerId2){
        let template = `
      <div class="bg-gray-600 min-h-screen pb-8">
        <div class="bg-white text-xl">
          <div class="mx-auto px-4">
            <div class="flex justify-between items-center py-6">
              <div class="flex justify-start">
                <h1 class="font-extrabold">Hacker News</h1>
              </div>
              <div class="items-center justify-end">
                <a href="#/page/{{__currentPage__}}" class="text-gray-500">
                  <i class="fa fa-times"></i>
                </a>
              </div>
            </div>
          </div>
        </div>
  
        <div class="h-full border rounded-xl bg-white m-6 p-4 ">
          <h2>{{__title__}}</h2>
          <div class="text-gray-400 h-20">
            {{__content__}}
          </div>
  
          {{__comments__}}
  
        </div>
      </div>
    `;
        super(containerId2, template);
    }
    render() {
        const id = location.hash.substr(7);
        const api = new NewsDetailApi(CONTENT_URL.replace('@id', id));
        const newsDetail = api.getData();
        for(let i = 0; i < store.feeds.length; i++)if (store.feeds[i].id === Number(id)) {
            store.feeds[i].read = true;
            break;
        }
        this.setTemplateData('comments', this.makeComment(newsDetail.comments));
        this.setTemplateData('currentPage', String(store.currentPage));
        this.setTemplateData('title', newsDetail.title);
        this.setTemplateData('content', newsDetail.content);
        this.updateView();
    }
    makeComment(comments) {
        for(let i = 0; i < comments.length; i++){
            const comment = comments[i];
            this.addHtml(`
        <div style="padding-left: ${comment.level * 40}px;" class="mt-4">
          <div class="text-gray-400">
            <i class="fa fa-sort-up mr-2"></i>
            <strong>${comment.user}</strong> ${comment.time_ago}
          </div>
          <p class="text-gray-700">${comment.content}</p>
        </div>      
      `);
            if (comment.comments.length > 0) this.addHtml(this.makeComment(comment.comments));
        }
        return this.getHtml();
    }
}
const router = new Router();
const newsFeedView = new NewsFeedView('root');
const newsDetailView = new NewsDetailView('r선oot');
router.setDefaultPage(newsFeedView);
router.addRoutePath('/page/', newsFeedView);
router.addRoutePath('/show/', newsDetailView);
router.route();

//# sourceMappingURL=index.fb2a819c.js.map
