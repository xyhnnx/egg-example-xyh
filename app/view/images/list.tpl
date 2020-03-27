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
                <img src="{{item.thumbURL}}"/>
            </li>
            {% endfor %}
        </ul>
    </body>
    <style>

    </style>
</html>
