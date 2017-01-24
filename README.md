# Qwert
Node.js web application development framework built on top of Express

## Installation
1. You can use [Qwert starter](https://github.com/gtabat/QwertStarter) github repository
    1. clone this repository on your local disk
    2. run `npm install` from command line
2. Or use npm repository
    1. run `npm install qwert` from command line in your project folder

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
####How to create / Example
create file in controllers directory, for example _TestController.js_ <br>
Contents:
```javascript
// file: controllers/TestController.js

const Controller = require("qwert/Controller");

module.exports = Controller(function($request, $response) {
  
}, {
    route: "/test"
});
```
this will create controller, that handles request on /test page<br>
Qwert injects services as controller function arguments by argument names, [read about services](#services)
#### Parameters
`Controller(fn, options)`
- **fn** - _Function_ - controller function, arguments are [services](#services)
- **options** - _Object_ - options of controller
    - **route (required)** - _String_ - route that will be handled by controller, this parameter is
    - **middleware** - _Array, String_ - middleware name or array of middleware names
    - **method** - _String_ - method that will be handled (GET, POST, PUT, PATCH etc...), default is GET

## ControllerGroup
Controller groups must be located in _controllers_dir_ directory

####How to create / Example
create file in controllers directory, for example TestControllerGroup.js<br>
Contents:
```javascript
// file: controllers/TestControllerGroup.js

const ControllerGroup = require("qwert/ControllerGroup");

var group = ControllerGroup({
    route: "/home"
});

group.add(Controller(function($request, $response) {
    
}, {
    route: "/main"
}));

module.exports = group;
```
This code will create ControllerGroup that handles requests on /home url<br>
Then added one controller which handles /home/main request, you can add as much controllers in group as needed

## Services
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
    * example: `$get.get('user_id');` same as *$post*
- `$model` - Model provider
    * example `var user = $model('User');`
- `$next` - used in Middleware, function that has to be called to continue request flow
- `$upload` - Service for accepting uploaded files, files won't stored unless you accept them by this service, generally used in middleware
    * example `$upload('file1').then(next);` where file1 is form field and next is callback function
- `$files` - files uploaded by `Content-Type: multipart/form-data` and received by $upload service
    * example `var filename = $files.handler().get('file1').moveAutoName(__dirname+'../images/', true);`