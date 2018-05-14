(function() {
    var app = angular.module('app', ['ngRoute', 'angular-jwt']);

    app.run(function($http, $location, $window, $rootScope) {

        $http.defaults.headers.common['Authorization'] = 'Bearer ' + $window.localStorage.token;

        $rootScope.$on('$routeChangeStart', function(event, nextRoute, currentRoute) {
            if(nextRoute.access !== undefined && nextRoute.access.restricted === true && !$window.localStorage.token) {
                event.preventDefault();
                $location.path('/');
            }
            if($window.localStorage.token && nextRoute.access.restricted === true) {
                $http.post('/api/verify-token', { token: $window.localStorage.token })
                     .then(function(response) {
                         console.log('Token is valid. May continue');
                     }, function(err) {
                         console.log('err has occured');
                         delete $window.localStorage.token;
                         $location.path('/login');
                     })
            }
        })
    })

    app.config(function($locationProvider, $routeProvider, $qProvider) {

        $qProvider.errorOnUnhandledRejections(false);

        $locationProvider.html5Mode(true);

        $routeProvider.when('/', {
            templateUrl: './templates/main.html',
            controller: 'MainController',
            controllerAs: 'vm',
            access: {
                restricted: false
            }
        });
        $routeProvider.when('/register', {
            templateUrl: './templates/register.html',
            controller: 'RegisterController',
            controllerAs: 'vm',
            access: {
                restricted: false
            }
        });
        $routeProvider.when('/logi', {
            templateUrl: './templates/login.html',
            controller: 'LoginController',
            controllerAs: 'vm',
            access: {
                restricted: false
            }
        });
        $routeProvider.when('/profile', {
            templateUrl: './templates/profile.html',
            controller: 'ProfileController',
            controllerAs: 'vm',
            access: {
                restricted: true
            }
        });
        $routeProvider.when('/books', {
            templateUrl: './templates/books.html',
            controller: 'BooksController',
            controllerAs: 'vm',
            access: {
                restricted: true
            }
        });
        $routeProvider.when('/books/:id', {
            templateUrl: './templates/book.html',
            controller: 'BookController',
            controllerAs: 'vm',
            access: {
                restricted: false
            }
        });

        $routeProvider.when('/users', {
            templateUrl: './templates/users.html',
            controller: 'UsersController',
            controllerAs: 'vm',
            access: {
                restricted: false
            }
        });

        $routeProvider.when('/users/:id', {
            templateUrl: './templates/user.html',
            controller: 'UserController',
            controllerAs: 'vm',
            access: {
                restricted: false
            }
        })

        $routeProvider.otherwise('/');

    });

    app.controller('MainController', MainController);

    function MainController($http, $window, $location) {
        var vm = this;
        vm.title = "MainController";
        vm.error = '';
        vm.login = function() {
               vm.error = '';  
             if(vm.user) {
                $http.post('/api/login', vm.user)
                     .then(function(response) {
                         console.log(response);
                         $window.localStorage.token = response.data;
                         //$location.path('/profile');
                     }, function(err) {
                         console.log(err);
                         vm.error = err;
                         vm.user = {};
                        
                     })
            }
            else {
                vm.error = 'Please provide valid credentials!'
                
            }
        };
        
         vm.register = function() {
           vm.error = '';
            if(vm.user) {
                $http.post('/api/register', vm.user)
                     .then(function(response) {
                         console.log(response);
                         $window.localStorage.token = response.data;
                        // $location.path('/profile');
                     }, function(error) {
                         vm.error = error;
                         vm.user = {};
                     })
            }
            else {
                vm.error = 'Please enter valid credentials!'
            }
        }
        
         vm.logout = function() {
            console.log('in logout path');
            vm.currentUser = null;
            delete $window.localStorage.token;
            $location.path('/main');
        }
        
        

        
       
    }

    app.controller('UserController', UserController);

    function UserController($http, $window, $location, $routeParams, jwtHelper) {
        var vm = this;
        vm.title = "UserController";
        var id =$routeParams.id;
        vm.user = {};

        var currentUser = jwtHelper.decodeToken($window.localStorage.token).data;

        $http.get('/api/users/' + id)
             .then(function(response) {
                 vm.user = response.data
             }, function(err) {
                 console.log(err)
             })

        vm.request = function(book) {
            console.log('in borrow path');
            $http.put('/api/borrow/' + book, { owner: $routeParams.id, borrower: currentUser._id  })
                 .then(function(response) {
                    console.log(response);
                 }, function(err) {
                    console.log(err);
                 })
        };
        
         vm.logout = function() {
            console.log('in logout path');
            vm.currentUser = null;
            delete $window.localStorage.token;
            $location.path('/main');
        }
    }

    app.controller('UsersController', UsersController);

    function UsersController($http, $window, $location) {
        var vm = this;
        vm.users = [];
        $http.get('/api/users').then(function(response) {
           vm.users = response.data;
        });
        
         vm.logout = function() {
            console.log('in logout path');
            vm.currentUser = null;
            delete $window.localStorage.token;
            $location.path('/main');
        }
    }

 app.controller('BookController', BookController);
 function BookController($http, $location, $window, $routeParams, jwtHelper) {
        var vm = this;
        vm.title = "BookController";
        vm.comments = [];
        vm.error = '';
        vm.message = '';
        var id = $routeParams.id;
        var name = $routeParams.name;
        var user = jwtHelper.decodeToken($window.localStorage.token).data.name;
        var borrower = jwtHelper.decodeToken($window.localStorage.token).data;
        

        vm.book = {};
        vm.getBook = function() {
           $http.get('/api/books/' + id)
             .then(function(response) {
                 console.log(response);
                 vm.book = response.data
                 
                 vm.commments = response.data.comments;
             }, function(err) {
                 console.log(err)
             })
       }
        vm.getBook();
        
        vm.isOwner = function(book){
            
            if(book.owner.id === borrower._id){
                return true;
            }
            return false;
        };
        
        
        
         vm.logout = function() {
            console.log('in logout path');
            vm.currentUser = null;
            delete $window.localStorage.token;
            $location.path('/main');
        };
        
        vm.request = function(book) {
            console.log('in borrow path');
           
            $http.put('/api/borrow/' + book._id, { owner: book.owner.id, borrower: borrower._id })
                 .then(function(response) {
                    console.log(response);
                    vm.message = response;
                 }, function(err) {
                    console.log(err);
                    vm.error = err;
                   
                 })
        };

        vm.addComment = function() {
           if(!vm.comment) {
               console.log('No comment provided');
           }
           else {
               $http.post('/api/books/comment', { id: id, comment: vm.comment, user: user } )
                    .then(function(response) {
                        vm.comment = '';
                        vm.getBook();
                    })
           }

       }
    }


    app.controller('BooksController', BooksController);

    function BooksController($http, $location, $window, $routeParams, jwtHelper) {
        var vm = this;
        vm.title = "BooksController";
        vm.books = [];
        vm.error = '';
        vm.cover = '';
        vm.loading = false;
        var owner = jwtHelper.decodeToken($window.localStorage.token).data;
      
        vm.addBook = function() {
            if(vm.book.title) {
                vm.loading = true;
                $http.post('/api/books/search', { title: vm.book.title, owner: { name: owner.name, id: owner._id  } })
                     .then(function(response) {
                         vm.book.title = '';
                         vm.getAllBooks();
                         $location.path('/books/' + response.data._id)
                         
                     }, function(err) {
                         console.log(err)
                         vm.error = err.data;
                     })
            } 
        }

        vm.getAllBooks = function() {
            $http.get('/api/books').then(function(response) {
                console.log(response);
                vm.books = response.data
                vm.loading = false;
            }, function(err) {
                console.log(err);
                vm.error = 'No books here yet!'
            })
        }

        vm.getAllBooks();
        
         vm.logout = function() {
            console.log('in logout path');
            vm.currentUser = null;
            delete $window.localStorage.token;
            $location.path('/main');
        }


    }

    app.controller('ProfileController', ProfileController);

    function ProfileController($http, jwtHelper, $window, $location, $routeParams, $timeout) {
        var vm = this;
        vm.title = "ProfileController";
        vm.books = [];
        vm.trades = [];
        vm.message = '';
        var tokenData = jwtHelper.decodeToken($window.localStorage.token).data;
        vm.currentUser = tokenData;
        vm.borrow = [];
        console.log(vm.currentUser);
        console.log(vm.currentUser.borrows.length);
        vm.logout = function() {
            console.log('in logout path');
            vm.currentUser = null;
            delete $window.localStorage.token;
            $location.path('/main');
        };
        
         vm.getBorrowedBooks = function() {
             for (var i=0; i < vm.currentUser.borrows.length; i++){
                 $http.get('/api/books/' + vm.currentUser.borrows[i]._id)
             .then(function(response) {
                 console.log(response.data.title);
                 vm.borrow.push(response.data.title);
             }, function(err) {
                 console.log(err)
             })
             }
             console.log(vm.borrow);
           
       }
       vm.getBorrowedBooks();

        vm.updateLocation = function() {
            $http.put('/api/users/' + vm.currentUser._id, { city: vm.currentUser.city, state: vm.currentUser.state, name: vm.currentUser.name })
                 .then(function(response) {
                    var btn = document.getElementById('update');
                    btn.innerHTML = 'Updated!'
                    $timeout(function() {
                        btn.innerHTML = 'Update';
                    }, 5000);
                    $window.localStorage.token = response.data;
                    console.log('Hi!')
                 }, function(err) {
                    console.log(err)
                 })
        }

        vm.removeBook = function(id) {
            $http.delete('/api/books/' + id)
                 .then(function(response) {
                     vm.getUserBooks();
                     vm.getAllBooks();
                 }, function(err) {
                     console.log(err)
                 });
        };
        vm.rejectTrade = function(book) {
             console.log(book);
            console.log('in reject route controller');
            
            $http.put('/api/reject/' + book._id, {owner: book.owner.id._id, borrower: book.requests.borrower._id  })
                 .then(function(response) {
                    console.log(response);
                    vm.message=response;
                 }, function(err) {
                    console.log(err);
                 });
        };
        
        vm.returnTrade = function(book) {
            console.log('in return route controller');
             console.log(book._id);
             console.log(book.owner.id._id);
             console.log(book.requests.borrower._id );
            $http.put('/api/return/' + book._id, {owner: book.owner.id._id, borrower: book.requests.borrower._id})
                 .then(function(response) {
                    console.log(response);
                    vm.message=response;
                 }, function(err) {
                    console.log(err);
                 });
        };
        
         vm.acceptTrade = function(book) {
            console.log('in accept route controller');
            
            $http.put('/api/accept/' + book._id, {owner: book.owner.id._id, borrower: book.requests.borrower._id  })
                 .then(function(response) {
                    console.log(response);
                    vm.message = response;
                 }, function(err) {
                    console.log(err);
                 });
        };

        vm.getUserTrades = function() {
            $http.get('/api/trades/byUser/' + tokenData._id)
                 .then(function(response) {
                    console.log(response);
                    vm.trades = response.data;
                 }, function(err) {
                    console.log(err)
                 })
        };

        vm.getUserBooks = function() {
            
            $http.get('/api/books/byUser/' + tokenData._id)
                 .then(function(response) {
                     console.log(response);
                     vm.books = response.data
                 }, function(err) {
                     console.log(err)
                 })
        };

        if(tokenData !== null) {
             vm.getUserTrades();
             vm.getUserBooks();
        };
       
    };

    app.controller('LoginController', LoginController);

    function LoginController($http, $location, $window) {
        var vm = this;
        vm.title = "LoginController";
        vm.error = '';
        vm.login = function() {
            if(vm.user) {
                $http.post('/api/login', vm.user)
                     .then(function(response) {
                         console.log(response);
                         $window.localStorage.token = response.data;
                         $location.path('/profile');
                     }, function(err) {
                         console.log(err);
                         vm.error = err;
                     })
            }
            else {
                vm.error = 'Please provide valid credentials!'
            }
        }

    }

    app.controller('RegisterController', RegisterController);

    function RegisterController($http, $location, $window) {
        var vm = this;
        vm.title = "RegisterController";
        vm.error = '';
        vm.register = function() {
            if(vm.user) {
                $http.post('/api/register', vm.user)
                     .then(function(response) {
                         console.log(response);
                         $window.localStorage.token = response.data;
                         $location.path('/profile');
                     }, function(error) {
                         vm.error = error;
                         vm.user = {};
                     })
            }
            else {
                vm.error = 'Please enter valid credentials!'
            }
        }

    }

}())
