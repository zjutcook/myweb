/**
 * commentBox 评论框
 * createClass/createElement
 */

/*** HTML 组件模块 ***/
var CommentBox = React.createClass({displayName: "CommentBox",
    loadCommentsFromServer: function(){
        // bind(this) 改变函数内部的this指向
        $.ajax({
            url: this.props.url,
            dataType: 'json',
            cache: false,
            success: function(response) {
                if (response && response.comments)
                    this.setState({data: response.comments});
                else
                    console.error(this.props.url, response, "获取数据失败");
            }.bind(this),
            error: function(xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },
    handleCommentSubmit: function(comment) {
        // 本地提交提前更新
        if (!comment && isNullObject(comment)) return;
        var tmpData = this.state.data;
        var newStateData = tmpData.concat([comment]);
        this.setState({data: newStateData});

        // TODO: submit to the server and refresh the list
        // 这里没有搭建回执服务器，所以使用js来更新本地JSON文件
        this.saveJSON(newStateData);
    },
    saveJSON: function(data) {
        var jsonCtrl = new JsonCtrl();
        jsonCtrl.saveFile(data);
    },
    getInitialState: function() {
        // getInitialState 在组件的生命周期中仅执行一次，用于设置组件的初始化 state
        return {data: []};
    },
    componentDidMount: function() {
        // componentDidMount 是一个组件渲染的时候被 React 自动调用的方法
        this.loadCommentsFromServer();
        // 实时动态更新评论信息，通过轮询实现（也可以WebSockets或者其他实时更新技术）
        // 动态更新界面，就是重新设置state.data：this.setState()
        setInterval(this.loadCommentsFromServer, this.props.pollInterval);
    },
    render: function() {
        return (
            React.createElement("div", {className: "commentBox"},
                React.createElement("h1", null, " comments "),
                React.createElement(CommentList, {data: this.state.data}),
                React.createElement(CommentForm, {onCommentSubmit: this.handleCommentSubmit})
            )
        );
    }
});

var CommentList = React.createClass({displayName: "CommentList",
    render: function() {
        var commentNodes = this.props.data.map(function(item){
            return (
                React.createElement(Comment, {author: item.author},
                    item.text
                )
            )
        });
        return (
            React.createElement("div", {className: "commentList"},
                commentNodes
            )
        );
    }
});

var CommentForm = React.createClass({displayName: "CommentForm",
    handleSubmit: function(e) {
        e.preventDefault();
        var author = this.refs.author.value.trim();
        var text = this.refs.text.value.trim();
        if (!author || !text) return;
        // TODO: send request to the server
        this.props.onCommentSubmit({author: author, text: text});

        this.refs.author.value = "";
        this.refs.text.value = "";
        return ;
    },
    render: function() {
        return (
            React.createElement("form", {className: "commentForm", onSubmit: this.handleSubmit},
                React.createElement("input", {type: "text", placeholder: "Your name", ref: "author"}),
                React.createElement("input", {type: "text", placeholder: "Say something...", ref: "text"}),
                React.createElement("input", {type: "submit", value: "Post"})
            )
        );
    }
});

var Comment = React.createClass({displayName: "Comment",
    rawMarkup: function() {
        var rawMarkup = marked(this.props.children.toString(), {sanitize: true});
        return { __html: rawMarkup };
    },
    render: function() {
        return (
            React.createElement("div", {className: "comment"},
                React.createElement("h2", {className: "commentAuthor"},
                    this.props.author
                ),
                React.createElement("span", {dangerouslySetInnerHTML: this.rawMarkup()})
            )
        );
    }
});

/*** HTML 模块渲染 ***/
ReactDOM.render( React.createElement(CommentBox, {url: "/myweb/data/commentBox.json", pollInterval: 3600000}) ,
    document.getElementById('content')
);

// 兼容IE8.0以下bind支持的兼容方法
if (!Function.prototype.bind) {
    Function.prototype.bind = function (oThis) {
        if (typeof this !== "function") {
            // closest thing possible to the ECMAScript 5 internal IsCallable function
            throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
        }

        var aArgs = Array.prototype.slice.call(arguments, 1),
            fToBind = this,
            fNOP = function () {},
            fBound = function () {
                return fToBind.apply(
                    this instanceof fNOP && oThis ? this : oThis || window, aArgs.concat(Array.prototype.slice.call(arguments))
                );
            };

        fNOP.prototype = this.prototype;
        fBound.prototype = new fNOP();

        return fBound;
    };
}
// 对象是否为空验证
function isNullObject() {
    var isHasObj = true;
    if (typeof data === "object" && !(data instanceof Array)) {
        for (var i in data) {
            isHasObj = false;
            break;
        }
    }
    return isHasObj;
}
// 本地JSON文件读写
var JsonCtrl = function(){};
JsonCtrl.prototype.saveFile = function(data) {
    var str = JSON.stringify(data);
    str = '{"comments": ' + str + ', "msg": "成功", "responseCode": 0}';

    // 保存至localStorage
    // localStorage.setItem("react_comments_key", str);
};
