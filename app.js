const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');

const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));
app.set('view engine', 'ejs');

mongoose.connect('mongodb://localhost:3000/wikiDB', {useNewUrlParser: true, useUnifiedTopology: true});

const ArticleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please enter the article title']
  },
  content: String
});

const Article = new mongoose.model('Article', ArticleSchema);

// Chained requests for the same path, to be served based on client API calls
app.route('/articles')
   .get(function(req, res){

      Article.find(function(err, completeArticleCollection){

        if(err){
          res.send('There was an error in getting the article collection !');
        }
        else{ // collection fetched successfully
          res.send(completeArticleCollection);
        }
      });

  })
   .post(function(req, res){

     console.log(req);
     // Create an instance of the Article model, which would essentially be a document in the articles collection of mongodb.
     const newArticle = new Article({ // The request body should have the title and content data mapped to respective keys, in line with the
                                      // following convention.
       title: req.body.title,
       content: req.body.content
     });

     newArticle.save(function(err, savedArticle){ // Can also have an additional argument, to retieve the saved document and have custom message based on that data
       if(err){
         // Buffer up the response content with write() and then have a single call to send() to relay the buffered content
         // res.write('Encountered below error while writing new article to the database: ');
         // res.write(err);
         res.send(err);
       }
       else{
         res.send('Article: ' + savedArticle.title + ", successfully written to the database !");
       }
     });

     //res.redirect('/');
   })
   .delete(function(req, res){

     Article.deleteMany(function(err){
       if(err){
         res.send('There was an error in deleting all the articles !');
       }
       else{
         res.send('Successfully deleted all the articles !');
       }
     });
   }); // Semi-colon is needed for the last one



// Chained requests for the path: /articles/:articleTitle, articleTitle would be the name of the article as stored in the backend mongodb.
// That article name would be used as a filter to get the matching article and perform requested operation through the chained http requests.
app.route('/articles/:articleTitle')
    .get(function(req, res){
      Article.find({title: req.params.articleTitle}, function(err, matchingArticle){
        if(err){
          res.send('There was an error is retrieving the desired article content !');
        }
        else{
          res.send(matchingArticle);
        }
      })
    })
    .put(function(req, res){

      Article.update({title: req.params.articleTitle}, // filter to select the article with id: req.params.articleId
                      req.body, /* having the arguments in the request body gives more felxibility
                                  to API user on what data fields to include and overwrite the whole document */
                      {overwrite: true,}, // overwrites the entire article retrieved with the filter. If the new article
                                          // has less fields, removed fields from the old article entry will not be accessible.
                      function(err){
                        if(err){
                          res.send('There was an error overwriting the article !');
                        }
                        else{
                          res.send('Article has been overwritten successfully !');
                        }
                      });

    })
    .patch(function(req, res){

        Article.update({title: req.params.articleTitle},
                        {$set: req.body}, // Set the fields with values passed in req.body
                        function(err){
                          if(err){
                            res.send('There was an error updating article with new data !');
                          }
                          else{
                            res.send('Article data has been successfully updated with new data !');
                          }
                        });

    })
    .delete(function(req, res){

      Article.deleteOne({title: req.params.articleTitle}, function(err){
        if(err){
          res.send('There was an error deleting the given article !');
        }
        else{
          res.send('Given article has been deleted successfully !');
        }

      });

    }); // Semi-colon for the last chained request to complete the .route() statement


// Setting up app server to listen for requests on port 3000
app.listen(3000, function(){
  console.log('Wiki-like articles site ready for requests !');
});
