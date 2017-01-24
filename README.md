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
    |-- controllers
    |-- middleware
    |-- models
    |-- views
</pre>

Qwert will scan these directories and read model, view, controller and middleware js files from there, You can read more about how to create these files below

## Modules
- `require("qwert")` - Main modules of framework
- `require("qwert/ControllerGroup")`
- `require("qwert/Controller")`
- `require("qwert/Middleware")`
- `require("qwert/Model")`

### Controller
**Note that every controller must be located in *controllers_dir* directory**<br>
Usage:
```javascript
Controller(func, config);
```
example controller<br>
```javascript
// file: controllers/TestController.js

const Controller = require("qwert/Controller");

module.exports = Controller(function($request, $response) {
  
}, {
    route: "/test"
});
```
this will create controller, that handles request on /test page<br>
Notice controller function arguments, they are services, you will read more about services below

### ControllerGroup
**Every controller group must be located in *controllers_dir***<br>
usage:
```javascript
var group = ControllerGroup(config);

group.add(controller1);
group.add(controller2);
```

Example:
```javascript
// file: controllers/hello.js

const ControllerGroup = require("qwert/ControllerGroup");

var group = ControllerGroup({
    route: "/hello"
});

group.add(Controller(function($request, $response) {
    
}, {
    route: "/world"
}));

module.exports = group;
```
this will create controller for url http://website.com/hello/world
You can add as many controllers to the group as needed


## Services
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
- `$upload` - Service for accepting uploaded files, files won't stored unless you accept them by this service, generally used in middleware
    * example `$upload('file1').then(next);` where file1 is form field and next is callback function
- `$files` - files uploaded by `Content-Type: multipart/form-data` and received by $upload service
    * example `var filename = $files.handler().get('file1').moveAutoName(__dirname+'../images/', true);`
    