export = index;
declare function index(superagent: any): any;
declare namespace index {
  function clearRoute(method: any, url: any): void;
  function clearRoutes(): void;
  function del(p0: any, p1: any): any;
  function get(p0: any, p1: any): any;
  function patch(p0: any, p1: any): any;
  function post(p0: any, p1: any): any;
  function put(p0: any, p1: any): any;
  const timeout: number;
  function unmock(superagent: any): void;
}
