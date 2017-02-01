# Qwert
Node.js web application development framework built on top of Express

## Installation
1. You can use [Qwert starter](https://github.com/gtabat/QwertStarter) github repository
    1. clone this repository on your local disk
    2. run `npm install` from command line
2. Or use npm repository
    1. run `npm install qwert` from command line in your project directory

## Configuration
example configuration:

```javascript
const qwert = require("qwert");
const path = require("path");

qwert.config({
    root_dir: path.resolve("./src"), // Required
    controllers_dir: "./controllers", // optional, default is "controllers"
    models_dir: "./models", // optional, default is "models"
    middleware_dir: "./middleware", // optional, default is "middleware"
    views: {
        dir: "./views" // optional, default is "views"
    },
    port: 3000
});

qwert.boot();
```
According to this configuration, our directory structure will be

<pre>
|-- index.js
|-- src
    |-- controllers
    |-- middleware
    |-- models
    |-- views
</pre>

Qwert will scan these directories and read model, view, controller and middleware js files from there, You can read more about how to create these files below

## Modules
- `require("qwert")` - [read docs](#qwert)
- `require("qwert/Controller")` - [read docs](#controller)
- `require("qwert/ControllerGroup")` - [read docs](#controllergroup)
- `require("qwert/Middleware")` - [read docs](#middleware)
- `require("qwert/Model")` - [read docs](#model)

## Controller
Controllers must be located in _controllers_dir_ directory
###How to create / Example
create file in controllers directory, for example _TestController.js_ <br>
Contents:
```javascript
// file: controllers/TestController.js

const Controller = require("qwert/Controller");

module.exports = Controller(function($request, $response) {
    // some controller logic
}, {
    route: "/test"
});
```
this will create controller, that handles request on /test page<br>
Qwert injects services as controller function arguments by argument names, [read about services](#services)

### Parameters
`Controller(fn, options)`
- **fn (required)** - _Function_ - controller function, arguments are [services](#services)
- **options (required)** - _Object_ - options of controller
    - **route (required)** - _String_ - route that will be handled by controller, this parameter is
    - **middleware** - _Array, String_ - middleware name or array of middleware names
    - **method** - _String_ - method that will be handled (GET, POST, PUT, PATCH etc...), default is GET

## ControllerGroup
Controller groups must be located in _controllers_dir_ directory

###How to create / Example
create file in controllers directory, for example TestControllerGroup.js<br>
Contents:
```javascript
// file: controllers/TestControllerGroup.js

const ControllerGroup = require("qwert/ControllerGroup");

var group = ControllerGroup({
    route: "/home"
});

group.add(Controller(function($request, $response) {
    // Some controller logic
}, {
    route: "/main"
}));

module.exports = group;
```
This code will create ControllerGroup that handles requests on /home path<br>
Then added one controller which handles /home/main request, you can add as much controllers in group as needed

### Parameters
`ControllerGroup(options)`
- **options (required)** - _Object_ - Controller group options
    - **route (required)** - _String_ - base path of the controllers in this group
    - **middleware** - _Array, String_ - middleware or list of middleware for this group

## Model
Models must be located in _models_dir_

### How to create / Example
create file in models directory, for example TestModel.js

Contents:
```javascript
// file: models/TestModel.js

const Model = require("qwert/Model");

module.exports = Model("test", function(args) {
    this.getName = function() {
        return "George";
    }
});
```
this code creates model with name **test**<br>
model can be instantiated from middleware or controller by service _$model_<br>
Example code:
```javascript
Controller(function($model, $param) {
    var userModel = $model("user"); // user is the name of model
    var user = userModel.getUser($param.get("id"));
    // some logic
}, {
    route: "/user/:id"
})
```

### Parameters
`Model(name, fn)`

- **name (required)** - _String_ - the name of model, must be unique among all models
- **fn (required)** - _Function_ - model function, will be instantiated with _new_ keyword
    - arguments are [services](#services)

##Middleware
Middleware must be located in _middleware_dir_ directory

##How to create / Example
Create file in middleware directory, for example TestMiddleware.js

Contents:
```javascript
// file: middleware/TestMiddleware.js
const Middleware = require("qwert/Middleware");

module.exports = Middleware("testMiddleware", function($response, $post, $next) {
    if(!$post.has("id")) {
        $response.json({
            error: "You must provide id"
        });
    } else {
        $next();
    }
});
```
this code creates middleware with name **testMiddleware**<br>
testMiddleware can be used as middleware of _Controller_ or _ControllerGroup_

_**Note:** In case if you don't call $next function, you have to handle response_

### Parameters
`Middleware(name, fn)`
- **name (required)** _String_ - the name of middleware, must be unique among middlewares
- **fn (required)** _Function_ - middleware function
    - arguments are [services](#services)

##Service injection
### Services
Services are used in controller, model and middleware functions<br>
Service is passed to the function by name<br>
Example
```javascript
function Test($post, $response) { // Parameter sequence and length has no matter
    $response.send($post.get("name"));
}
```
- `$request` - express request object [see docs](#)
- `$response` - express response object [see docs](#)
    * example: `$response.send("Hello world");`
- `$post` - POST data of the request
    * example 1: `$post.get("user_id"); // returns empty string if no user_id in post data`
    * example 2: `$post.all(); // returns object that contains all post data`
- `$get` - GET data of the request
- `$param` - Parameters of the router
    - for example, router string: `/user/:id`, `$param.get("id")` will return the id
    * example: `$get.get('user_id');` same as *$post*
- `$model` - Model provider
- `$session` - Session handler service
    * example `var user = $model('User');`
- `$next` - used in Middleware, function that has to be called to continue request flow
- `$upload` - Service for accepting uploaded files, files won't stored unless you accept them by this service, generally used in middleware
    * example `$upload('file1').then(next);` where file1 is form field and next is callback function
- `$files` - files uploaded by `Content-Type: multipart/form-data` and received by $upload service
    * example `var filename = $files.handler().get('file1').moveAutoName(__dirname+'../images/', true);`