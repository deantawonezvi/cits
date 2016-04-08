var express = require('express');
var router = express.Router();
var natural = require('natural');
var nools = require('nools');
var classifier = new natural.BayesClassifier();
var compiler = require('compilex');
var nlp = require('../nlp.js');
var option = {stats : true};
compiler.init(option);
var output = "";
var qresonse = "";
var progress = 0;
var definition_counter = 0;
var recognition_counter = 0;
var applcation_counter = 0;



var isAuthenticated = function (req, res, next) {
  if (req.isAuthenticated())
    return next();
  res.redirect('/');
};

module.exports = function(passport,io){

  /* GET login page. */
  router.get('/', function(req, res) {

    res.render('index', { message: req.flash('message') });
        });
  router.get('/login', function(req, res) {


    res.render('login', { message: req.flash('message') });
  });
  /* Handle Login POST */
  router.post('/login', passport.authenticate('login', {
    successRedirect: '/profile',
    failureRedirect: '/login',
    failureFlash : true
  }));
  /* GET Registration Page */
  router.get('/signup', function(req, res){
    res.render('register',{message: req.flash('message')});
  });
  /* Handle Registration POST */
  router.post('/signup', passport.authenticate('signup', {
    successRedirect: '/profile',
    failureRedirect: '/signup',
    failureFlash : true
  }));
  /* GET Home Page */
  router.get('/home', isAuthenticated, function(req, res){
    res.render('home', { user: req.user });
  });
  /* Handle Logout */
  router.get('/signout', function(req, res) {
    req.logout();
    res.redirect('/');
  });
    router.get('/profile', isLoggedIn, function(req, res){
    res.render('profile.ejs', { user: req.user, out:output, q_response:qresonse, q_progress: progress });
  });
    router.post('/profile', function(req,res){
        req.user.skill_level = req.body.skill_level;

        req.user.save(function(err){
             if(err)
                return err;
         });
        res.redirect('/profile');
        res.redirect('/profile');

    });
    router.post('/lesson_1', function(req,res){
        req.user.lesson_counter = 1;

        req.user.save(function(err){
            if(err)
                return err;
        });
        res.redirect('/profile');
    });

    router.post('/lesson_2',function(req,res){
            req.user.update({lesson_counter: 2}, function (err) {
                if (err) {
                    return err;
                }
            });
            res.redirect('/profile');
    });
    router.post('/lesson_3',function(req,res){
        if (req.body.feedback == "yes"){
            req.user.update({lesson_counter :3}, function(err){
                if (err){
                    return err;
                }
            });
            res.redirect('/profile');
        }
        if (req.body.feedback == "no"){
            res.redirect('profile')
        }
        if (req.body.feedback == "quiz"){
            req.user.update({
                    lesson_counter:2.1,
                    quiz_counter:1
                },
                function(err){
                if (err){
                    return err;
                }
            });
         res.redirect('/profile')

        }



    });
    router.get('/compile', function(req,res){
        res.render('compilex',{user:req.user});
    });

    router.post('/q1', function(req,res){


        progress = 1;
        var q1 = nlp.q_mainfunction(req.body.main_function);

        // Correct Answer
        if(q1 == 1){
            qresonse = 1;
            req.user.update({
                learning_rate:{
                    definition: definition_counter
                }
            });
            console.log(req.user.learning_rate.definition);
        }


        // Wrong Answer
        if(q1 == 1.5){
            qresonse = 1.5;
        }
        if(q1 == 2){
            qresonse = 2;
        }
     console.log(qresonse);


    res.redirect('/profile');
    });


    router.post('/q3', function(req,res){
        var q3 = nlp.q_printf(req.body.printf);

        progress = 2;
        if(q3 == 1){
            qresonse = 1;
            req.user.learning_rate.definition = 1;
            req.user.save(function(err){
                if(err)
                    return err;
            });
        }
        if(q3 == 1.5){
            qresonse = 1.5;
        }
        if(q3 == 2){
            qresonse = 2;
        }
        console.log(q3);


        res.redirect('/profile');
    });

    router.post('/q2' , function (req , res ) {

        progress = 3;
        var code = req.body.code;

        var envData = { OS : "windows" , cmd : "g++"};
        compiler.compileCPP(envData , code  , function (data) {

            //Wrong Answer
            if(data.error)
            {
                var q_error = nlp.q_program_mainfunction(data.error);
                console.log (data.error);
                //wrong declaration
                if(q_error == 0){
                   qresonse = 0;
                    res.redirect('/profile');
                }
                //messed with code
                if(q_error == 0.5 ){
                    qresonse = 0.5;
                    res.redirect('/profile');
                }
                //wrong position
                if(q_error == 1 ){
                    qresonse = 1;
                    res.redirect('/profile');
                }

            }
            //Correct Answer
            else
            {
                qresonse = 2;
                output = data.output;
                res.redirect('/profile');
            }
            console.log(qresonse);
        });


    });


  ///////Rules For Quiz Clasification///////////
    router.post('/endofq1' , function(req,res){

        var flow = nools.flow("Quiz 1 Deficiency Classification", function (flow) {


            this.rule("Application Deficiency", [Number, "n", "n < 4"], function (facts) {
                console.log("tttttt");
            });
            this.rule("Recognition Deficiency", [Number, "n", "n < 4"], function (facts) {
                console.log("tttttt");
            });
            this.rule("Definition Deficiency", [Number, "n", "n < 4"], function (facts) {
                console.log("tttttt");
            });
        });


        var session = flow.getSession();

        session.assert(3);
        session.match();





    });









    router.get('/fullStat' , function(req , res ){
        compiler.fullStat(function(data){
            res.send(data);
        });
    });



    router.get('/lesson_1',isLoggedIn, function(req,res){
    res.render('lesson1',{user:req.user});
    });
    router.get('/another', isLoggedIn, function(req, res){
        res.render('another.ejs', {user:req.user});
    });
    router.get('/lessons',isLoggedIn, function(req, res) {
        res.render('lessons.ejs', {user:req.user});
    });

    router.get('*', function(req,res){
        res.render('404.ejs');
    });



  return router;
  function isLoggedIn(req, res, next) {
    if(req.isAuthenticated()){
      return next();
    }
    res.redirect('/login');
  }
};



