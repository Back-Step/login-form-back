var http = require('http');// 필요한 모듈을 가져온다.
var fs = require('fs');
var url = require('url');
var qs = require('querystring');

const init = () => {
  console.log("Hello world!");
};
 
init();

var app = http.createServer(function (request, response) {
  var _url = request.url;// url 받기
  var queryData = url.parse(_url, true).query;// 문법공부? url을 object로 받기
  var pathName = url.parse(_url, true).pathname;
//  console.log(url.parse(_url, true));
  var title = queryData.id;

  var body ='';
  request.on('data',function(data){
          body= body + data;
  });
  request.on('end',function(){
          var post = qs.parse(body);
          // qs의 parse라는 함수에 지금까지 구한 body를 전달한다
          var title=post.title;
          var description=post.description;
          fs.writeFile(`data/${title}`,description,'utf8',function(err){
              response.writeHead(302,{Location:`/?id=${title}`});//리디렉션
              response.end();
          })
  });
 

}

