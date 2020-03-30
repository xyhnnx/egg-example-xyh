<!-- app/view/news/list.tpl -->
<html>
    <head>
        <title>Hacker News</title>
    </head>
    <body>
        <div>
            <div>
                标题
                <input id="title" type="text" value="{{data.title}}">
            </div>
            <div>
                内容
                <textarea id="textarea">{{data.content}}</textarea>
            </div>
            <div>
                <button id="save">保存</button>
            </div>
        </div>
        <script>
          function postData(url, data) {
            // Default options are marked with *
            return fetch(url, {
              body: JSON.stringify(data), // must match 'Content-Type' header
              cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
              // credentials: 'same-origin', // include, same-origin, *omit
              headers: {
                // 'user-agent': 'Mozilla/4.0 MDN Example',
                'content-type': 'application/json'
              },
              method: 'POST', // *GET, POST, PUT, DELETE, etc.
              // mode: 'cors', // no-cors, cors, *same-origin
              // redirect: 'follow', // manual, *follow, error
              // referrer: 'no-referrer', // *client, no-referrer
            })
               // parses response to JSON
          }
            document.getElementById('save').onclick = () => {
              postData('/new-detail', {
                title: document.getElementById('title').value || 'xxx',
                content: document.getElementById('textarea').value || 'ccc'
              }).then(e=>{
                console.log(e)
                window.location.href = '/news'
              })
            }
        </script>
    </body>
</html>
