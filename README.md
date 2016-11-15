# Dcor
## JavaScript function decoration based on [Aspect-oriented programming](https://en.wikipedia.org/wiki/Aspect-oriented_programming) 

A simple JavaScript library for decorating functions with common and useful cross-cutting concerns like 
logging, authorization, caching, etc. 
It is heavily based on closures and functional aspects of JavaScript.

Note: 
While the library has been tested in browser, it's not tested on Node.js yet.
    
### Dcor predefined aspects:
  - `logged`: Allows logging function calls along with the passed arguments and the return values
  - `secured`: Secures a function by ignoring (or breaking) unauthorized calls 
  - `cached`: Stores the function return value to cache (memory) and use it for later calls
  - `performanceLogged`: Measures the runtime duration of the function
  - `singleton`: Makes the function singleton. All future instances will be the same.
  - `safeConstructor`: Protects constructor functions against NOT using `new`. Any call will be considered as an instantiation. 
  - `async`: Makes synchronous functions asynchronous to prevent UI blocking
  
### Usage:

```
//define function
function foo {}

//decorate it
Dcor.logged("foo", function (fname, fargs, res) {
    console.log("Log> function " + fname + " called with: ", fargs, " and returned: ", res);
});

//run it
foo(); //args and result value should be logged from now on 
```

See more [examples](https://github.com/skilledDeveloper/Dcor/blob/master/examples.js)
