<!-- app/view/news/list.tpl -->
<html>
    <head>
        <title>Hacker News</title>
    </head>
    <body>
        <div>
            <a href="/new-detail">new</a>
        </div>
        <ul class="news-view view">
            {% for item in list %}
            <li class="item">
                <b>{{ item.label}}</b> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                <span>{{item.value}}</span>
            </li>
            {% endfor %}
        </ul>
    </body>
</html>
