/**********************************************************
	Dcor-test.js - Some use cases and tests for Dcor
	
	Alan Zawari 
	May 2014
	
	Note: 
		First define all sample functions (Block #1)
		and then try different test cases one by one (Block #2)
***********************************************************/

//------------------------------------------------------------
//Block #1. Define some sample functions...
//------------------------------------------------------------

function foo(a, b) {
    console.log("inside foo. this:", this);
    return "hello " + a + " " + b;
}

function bar(a, b, c) {
    var d = 1;
    return a + b + c + d;
}

var myLib = {
    foo: function (s) {
        return "myLib.foo says: " + s;
    },
    bar: 10
};

var MySinglton = function () {
    this.a = 1024;
};

function MyCtor(c) {
    var prvt = 9;
    var d = c || 0;
    this.a = "foo";
    this.b = d + prvt + 1;
    console.log("this.b: ", this.b); //10
}

function isPrime(value) {
    var prime = value != 1; // 1 can never be prime
    for (var i = 2; i < value; i++) {
        console.log("Checking " + i);
        if (value % i === 0) {
            prime = false;
            break;
        }
    }
    return prime;
}

function recursiveFunc(n) {
    return n > 1 ? recursiveFunc(n - 1) + "-Hi" : "Hi";
}

function lengthyOperation(n) {
    console.log("lengthyOperation started. n:" + n);
    var res = 0;
    for (var i = 0; i < n; i++) {
        for (var j = 0; j < n; j++) {
            res += (i + j);
        }
    }
    console.log("lengthyOperation completed. res:" + res);
    return res;
}

//------------------------------------------------------------
//Block #2: Decorate functions and call them
//------------------------------------------------------------

//************************************************************

//normal call:
foo("beautiful", "world"); 

//decorate it:
Dcor.logged("foo", function (fname, fargs, res) {
    console.log("Log> function " + fname + " called with: ", fargs, " and returned: ", res);
});

//expect:
foo("beautiful", "world"); //should be logged

//************************************************************

//normal call:
new MyCtor();

//decorate it:
Dcor.decorate("MyCtor", [{
    type: "safeConstructor"
}]);

//expect: 
MyCtor(); //should be the same as new MyCtor().
new MyCtor();
console.log(typeof b == "undefined"); //global context shouldn't affected and therefore 'b' must not exist

//************************************************************

//normal call:
lengthyOperation(30000); //should take about 5 seconds and UI is blocked
console.log("hooray! lengthyOperation is done."); //no result until lengthyOperation is completed

//decorate it:
Dcor.decorate("lengthyOperation", [{
    type: "async",
    callback: function (fname, fargs, res, f, ns) {
        console.log("Async> function " + fname + " called with: ", fargs, " and returned: ", res);
    }
}]);

//expect: 
lengthyOperation(30000); //async. shouldn't block the UI
console.log("hooray! lengthyOperation is done."); //we should see this immediately

//************************************************************

//normal call:
mySinglton1 = new MySinglton();
mySinglton2 = MySinglton();
console.log("mySinglton1 === mySinglton2?", mySinglton1 === mySinglton2) //false. two different instances

//decorate it:
Dcor.singleton("MySinglton");

//expect: 
mySinglton1 = new MySinglton();
mySinglton2 = MySinglton();
console.log("mySinglton1 === mySinglton2?", mySinglton1 === mySinglton2) //true. two instances are the same

//************************************************************

//normal call:
isPrime(173); 
isPrime(173); //both calls take the same amount of time

//decorate it: with "cached" and "performanceLogged"
Dcor.decorate("isPrim.*", [{
    type: "cached",
    callback: function (fromCache, fname, fargs, res, f, ns) {
        if (fromCache) console.log("Cache> function " + fname + " called with: ", fargs, " and returned result: ", res + " from cache");
        else console.log("Cache> function " + fname + " called with: ", fargs, " and stored result: ", res + " to cache");
    }
}, {
    type: "performanceLogged",
    callback: function (duration, fname, fargs, res, f, ns) {
        console.log("Perf> function " + fname + " called with: ", fargs, " and ran for:", duration + "ms");
    }
}]);

//expect: isPrime is now cached and performanceLogged
isPrime(173); //must be calculated and show the execution time
isPrime(173); //this time must be retrieved from cache with faster execution time

//************************************************************

//normal call:
recursiveFunc(25); //25 recursion

//decorate it:
Dcor.cached("recursiveFunc", function (fromCache, fname, fargs, res, f, ns) {
    if (fromCache) console.log("Cache> function " + fname + " called with: ", fargs, " and returned result: ", res + " from cache");
    else console.log("Cache> function " + fname + " called with: ", fargs, " and stored result: ", res + " to cache");
});

//expect:
recursiveFunc(25); //25 recursion
recursiveFunc(10); //no recursion. should use cache
recursiveFunc(17); //no recursion. should use cache

//************************************************************

//normal call:
myLib.foo("hi"); //runs normally. no authorization required

//decorate it:
Dcor.secured("foo", function (fname, fargs) {
    var authorized = false; //check whether it is allowed to call this function...
    if (!authorized) 
		//return false to silently prevent running this function 
		throw new Error("Not authorized to run function " + fname + " with: " + fargs); 
    else 
		return true;
    //console.log("Authorization> Not authorized to run function " + fname + " with: ", fargs);
}, [myLib]);

//expect:
myLib.foo("hi"); //won't run. should give authorization error

//************************************************************
