<!-- app/view/news/list.tpl -->
<html>
    <head>
        <title>Hacker News</title>
    </head>
    <body>
        <ul class="news-view view">
            {% for item in list %}
            <li class="item">
                {{ item.label}}
                <img src="{{item.src}}"/>
            </li>
            {% endfor %}
        </ul>
    </body>
    <style>
        *{
            margin: 0;
            padding: 0;
        }
        ul {
            list-style: none;
        }
        .news-view {
            display: flex;
            flex-wrap: wrap;
        }
    </style>
</html>
