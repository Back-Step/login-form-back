//라우트와 미들웨어
//body-parser
//정적인 파일  이미지, 자바스크립트 다운 static files 제공 

const express = require('express')
const app = express()
const port = 3000
var fs = require('fs');
var path = require('path')
var template = require('./lib/template.js')
var sanitizeHtml = require('sanitize-html');
var compression = require('compression')
const { response } = require('express');
var qs = require('querystring')
var bodyParser=require('body-parser');
// npm i nsg -g  보안체크
// procter app, 보안이슈 해결
var helmet = require('helmet');
app.use(helmet());
//public에서 정직인 파일 가능
app.use(express.static('public'))
//get 보통 routing이라고함
//path에 따라 요청한 자원을 보내줌
//기존 Node의 createServer를 사용하면 코드의 블록이 매우 커지므로 가독성이 떨어진다.
//get 방식을 사용하면 각각의 path별로 관리가능 => 기존에는 if문을 사용 하여 관리
app.use(bodyParser.urlencoded({extended: false}));
//use( ~~) ~~부분은 미들웨어 실행 부분
// bodyparser사용자가 전송한 post내부정보를 분석해서 => 끝날때 body 만들어줌

//페이지의 용량이 크다면 압축을 통해 전송을하여 비용을 아낀다. 압축하고 해제하는 것이 전송보다 대체로 저렴하다 
app.use(compression());
//미들웨어 만들기
//app.use(funcion(request,response,next)){} -> app.get .. 
//post 에서는 목록을 가져올 필요가 없기때문에 get일때만 처리한다.
app.get('*',function(request,response,next){
  fs.readdir('./data', function(error, filelist){
    request.list = filelist;
    next();
  });
});

 app.get('/', (request, response) => {
 
    var title = 'Welcome';
    var description = 'Hello, Node.js';
    var list = template.list(request.list);
    var html = template.HTML(title, list,
      `<h2>${title}</h2>${description}
       <img src='images/hello.jpeg' style="width:300px; display:block; margin-top:10px;">
      `,
      `<a href="/create">create</a>`
    );
    response.send(html);
  
})

app.get('/page/:pageId', (request, response,next)=>{
  
    var filteredId = path.parse(request.params.pageId).base;
    fs.readFile(`data/${filteredId}`, 'utf8', function(err, description){
      //에러처리 페이지 파일 뒤 존재하지 않는 이름이 나오면 에러 
      if(err){
        //무조건 인자가 4개인 미들웨어로 간다
        next(err);
      }
      else{
        var title = request.params.pageId;
        var sanitizedTitle = sanitizeHtml(title);
        var sanitizedDescription = sanitizeHtml(description, {
          allowedTags:['h1']
        });
        var list = template.list(request.list);
        var html = template.HTML(sanitizedTitle, list,
          `<h2>${sanitizedTitle}</h2>${sanitizedDescription}`,
          ` <a href="/create">create</a>
            <a href="/update/${sanitizedTitle}">update</a>
            <form action="/delete" method="post">
              <input type="hidden" name="id" value="${sanitizedTitle}">
              <input type="submit" value="delete">
            </form>`
        );
        response.send(html)
      }
      
    });
  
  
}

)
app.get('/create',(request,response)=>{
  
    var title = 'WEB - create';
    var list = template.list(request.list);
    var html = template.HTML(title, list, `
      <form action="/create" method="post">
        <p><input type="text" name="title" placeholder="title"></p>
        <p>
          <textarea name="description" placeholder="description"></textarea>
        </p>
        <p>
          <input type="submit">
        </p>
      </form>
    `, '');
    response.send(html);
  

})

app.post("/create",(request,response)=>{
  
 
      //body-parser 사용
      var post = request.body;  
      var title = post.title;
      var description = post.description;
      fs.writeFile(`data/${title}`, description, 'utf8', function(err){
        response.redirect(`/?id=${title}`);
      })
  
  
})

app.get('/update/:pageId',(request,response)=>{
 
    var filteredId = path.parse(request.params.pageId).base;
    fs.readFile(`data/${filteredId}`, 'utf8', function(err, description){
      var title = request.params.pageId;
      var list = template.list(request.list);
      var html = template.HTML(title, list,
        `
        <form action="/update" method="post">
          <input type="hidden" name="id" value="${title}">
          <p><input type="text" name="title" placeholder="title" value="${title}"></p>
          <p>
            <textarea name="description" placeholder="description">${description}</textarea>
          </p>
          <p>
            <input type="submit">
          </p>
        </form>
        `,
        `<a href="/create">create</a> <a href="/update?id=${title}">update</a>`
      );
      response.send(html)
    });
  
})

app.post('/update',(request,response)=>{


      var post = request.body;
      var id = post.id;
      var title = post.title;
      var description = post.description;
      fs.rename(`data/${id}`, `data/${title}`, function(error){
        fs.writeFile(`data/${title}`, description, 'utf8', function(err){
          response.redirect(`/page/${title}`);
        })
      });
  
})
app.post('/delete',(request,response)=>{
 
     
          var post = request.body
          var id = post.id;
          var filteredId = path.parse(id).base;
          fs.unlink(`data/${filteredId}`, function(error){
            response.redirect('/');
          })
      
})
//미들웨어는 순착적으로 실행하기때문에 마지막에 위치
app.use((request,response,next)=>{
response.status(404).send('Sorry cant find that');
})
//인자가 4개라면 에러를 핸들링한다고 약속
app.use(function (err, req, res, next) {
  console.error(err.stack)
  res.status(500).send('Something broke!')
});
//listen이 실행 될 때 app을 시작하고 3000번에 귀기울임, createServer를 사용하지않고 listen이 시작될때 앱실행
// app.listen(port, () => {
//   console.log(`Example app listening on port ${port}`)
// })
app.listen(3000,function(){console.log('Example app listening on port 3000')})


