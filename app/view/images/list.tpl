<!-- app/view/news/list.tpl -->
<html>
    <head>
        <title>Hacker News</title>
    </head>
    <style>
        *{
            margin: 0;
            padding: 0;
        }
        ul {
            list-style: none;
        }
        .news-view {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr 1fr;
            grid-gap: 0px;
        }
        .item{
            position: relative;
        }
        img{
            width: 100%;
            display: block;
        }
        .title{
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            text-align: right;
            color: #fff;
            z-index: 1;
        }
    </style>
    <body>
        <ul class="news-view view">
            {% for item in list %}
            <li class="item">
                <img src="{{item.src}}"/>
                <p class="title">{{ item.label}}</p>
            </li>
            {% endfor %}
        </ul>
    </body>

</html>
