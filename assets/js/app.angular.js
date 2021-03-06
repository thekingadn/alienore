/**
 * module pour réaliser un post comme jQuery
 * Plus d'info : http://victorblog.com/2012/12/20/make-angularjs-http-service-behave-like-jquery-ajax/
 */
 angular.module('postModule', [], ["$httpProvider", function($httpProvider) {
  // Use x-www-form-urlencoded Content-Type
  $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';

  /**
   * The workhorse; converts an object to x-www-form-urlencoded serialization.
   * @param {Object} obj
   * @return {String}
   */ 
   var param = function(obj) {
    var query = '', name, value, fullSubName, subName, subValue, innerObj, i;

    for(name in obj) {
      value = obj[name];

      if(value instanceof Array) {
        for(i=0; i<value.length; ++i) {
          subValue = value[i];
          fullSubName = name + '[' + i + ']';
          innerObj = {};
          innerObj[fullSubName] = subValue;
          query += param(innerObj) + '&';
        }
      }
      else if(value instanceof Object) {
        for(subName in value) {
          subValue = value[subName];
          fullSubName = name + '[' + subName + ']';
          innerObj = {};
          innerObj[fullSubName] = subValue;
          query += param(innerObj) + '&';
        }
      }
      else if(value !== undefined && value !== null)
        query += encodeURIComponent(name) + '=' + encodeURIComponent(value) + '&';
    }

    return query.length ? query.substr(0, query.length - 1) : query;
  };

  // Override $http service's default transformRequest
  $httpProvider.defaults.transformRequest = [function(data) {
    return angular.isObject(data) && String(data) !== '[object File]' ? param(data) : data;
  }];
}]);

var app = angular.module('alienore', ['postModule']);

/* afficher un loader pendant les requêtes ajax */
//Credit: http://stackoverflow.com/a/17850865
app.factory('httpInterceptor', ['$q', '$rootScope', function($q, $rootScope) {
  var currentRequestsCount = 0;
  return {
        //Everytime a request starts, the loader is displayed
        request: function(config) {
          currentRequestsCount++;
          $rootScope.$broadcast('loaderShow');
          return config || $q.when(config)
        },
        //When a request ends, and if there is no request still running, the loader is hidden
        response: function(response) {
          if ((--currentRequestsCount) === 0) {
            $rootScope.$broadcast('loaderHide');
          }
          return response || $q.when(response);
        },
        //When a request fails, and if there is no request still running, the loader is hidden
        responseError: function(response) {
          if (!(--currentRequestsCount)) {
            $rootScope.$broadcast('loaderHide');
          }
          return $q.reject(response);
        }
      };
    }]);

app.config(['$httpProvider', function($httpProvider) {
  $httpProvider.interceptors.push('httpInterceptor');
}]);

/**
 * filtre pour permettre l'affichage des entités html
 */
 app.filter('unsafe', ['$sce', function($sce) {
  return function(val) {
    return $sce.trustAsHtml(val);
  };
}]);

/*
* Main controller
* - display the links
* - display the tag list
* - search tool
*
*/
app.controller('mainCtrl', ['$scope', '$http',function($scope, $http){

  $scope.currentPage = 1; //page courante
  $scope.limit = 1; //nombre de page
  $scope.search = undefined; //dernière recherche
  $scope.pagination = 'default'; //différencier : liens/ liens par tag/ recherche : default/tags/search
  $scope.moreLinks = true; //si il y a davantage de liens
  $scope.tagsSelected = [];
  $scope.tags = [];
  $scope.links = [];
  $scope.nbLinks = 0;
  $scope.token = ''; //token de l'utlisateur pour prévenir des failles CSRF
  $scope.formDataLink = {};
  $scope.formDataTag = {};
  $scope.formDataSearch = {};
  $scope.showLoader = false;

  $scope.getLinks = function(){
    //on cherche les lens à afficher
    $http.get('?c=links&a=data_all')
    .success(function(data){
      $scope.links = data.links;
      $scope.limit = data.nbPages;
      $scope.token = data.token;
      $scope.nbLinks = data.nbLinks;
      $scope.pagination = 'default';
      $scope.moreLinks = true;
    });
  };

  //initialiser le scope
  $scope.init = function(){
      //on cherche les lens à afficher
      $scope.getLinks();

      //on cherche les tags à afficher
      $http.get('?c=tags&a=data_all')
      .success(function(data){
        $scope.tags = data.tags;
      });
    };

  //initialisation du scope
  $scope.init();

  $scope.newLink = function(){
    $scope.formDataLink = {};
    $('#modal-link').modal('show');
  }

  /**
   * action édition d'un lien
   * @param  {int} linkId 
   */
   $scope.editLink = function(linkId){
    //on réinitialise le formulaire
    $scope.formDataLink = {}
    $('#tagBox').tagging('reset');

    $http.get('?c=links&a=data_get&linkId=' + linkId)
    .success(function(data) {
      $scope.formDataLink = data.link;
      var _tags = [];
      for (_i = 0; _i < data.tags.length; ++_i) {
        $('#tagBox').tagging("add", data.tags[_i].label);
      }
    });
    $('#modal-link').modal('show');
  };

  /**
   * action submit le formulaire d'édition/d'ajout d'un lien
   * @return {object} retourne le lien + les tags (ajoutés/supprimés/nouveaux(BDD)/ceux qui n'ont pas été modifiés)
   */
   $scope.submitLink = function (){
    $scope.formDataLink.tags = $('#tagBox').tagging('getTags');
    var _url = '?c=links&a=data_saved';
      //si c'est une édition
      if($scope.formDataLink.id){
        _url += '&linkId=' + $scope.formDataLink.id;
      }
      $http.post(_url, $scope.formDataLink)
      .success(function(data) {
        //cas d'un nouveau lien
        if(!$scope.formDataLink.id){
          //on cherche à afficher le lien et ses tags
          var _tagsLink = [];
          var _nbAddedTags = data.tags.added.length;
          for(var i = 0; i < _nbAddedTags; ++i){
            _tagsLink.push({'label' : data.tags.added[i].label, 'id' : data.tags.added[i].id});
          }
          //on ajoute le nouveau lien au début du tableau
          $scope.links.splice(0,0,{
            'link' : data.link,
            'tags' : _tagsLink
          });
          $scope.nbLinks += 1;
          //on cherche à afficher les tags ajoutés au nouveau lien
          //cas d'un nouveau tag
          var _nbNewTags = data.tags.new.length;
          for( var i = 0; i < _nbNewTags; ++i){
            $scope.tags.push({
              'count' : 1,
              'label' : data.tags.new[i].label, 
              'id' : data.tags.new[i].id
            });
          }
          //cas d'un lien déjà existant
          _nbTags = $scope.tags.length;
          _nbTagsAdded = data.tags.added.length;
          for(var i = 0; i < _nbTags; ++i){
            for(var j = 0; j < _nbTagsAdded; ++j){
              if(data.tags.added[j].id == $scope.tags[i].id){
                $scope.tags[i].count += 1;
                break;
              }
            }
          }

          // édition d'un lien
        }else{
          //MAJ du lien
          var _nbLinks = $scope.links.length;
          for(var i = 0; i < _nbLinks; ++i){
            if($scope.formDataLink.id == $scope.links[i].link.id){
              $scope.links[i].link = data.link;
              $scope.links[i].tags = data.tags.added.concat(data.tags.default);
              break;
            }
          }
          //MAJ des tags dans la sidebar
          _nbTags = $scope.tags.length;
          //cas d'un tag ajouté au lien
          _nbTagsAdded = data.tags.added.length;
          for(var i = 0; i < _nbTags; ++i){
            for(var j = 0; j < _nbTagsAdded; ++j){
              if(data.tags.added[j].id == $scope.tags[i].id){
                $scope.tags[i].count += 1;
                break;
              }
            }
          }
          //cas d'un tag supprimé au lien
          _nbTagsDeleted = data.tags.deleted.length;
          for(var i = 0; i < _nbTags; ++i){
            for(var j = 0; j < _nbTagsDeleted; ++j){
              if(data.tags.deleted[j].id == $scope.tags[i].id){
                $scope.tags[i].count -= 1;
                break;
              }
            }
          }
          //cas d'un nouveau lien
          var _nbNewTags = data.tags.new.length;
          for( var i = 0; i < _nbNewTags; ++i){
            $scope.tags.push({
              'count' : 1,
              'label' : data.tags.new[i].label, 
              'id' : data.tags.new[i].id
            });
          }
        }
        //on affiche la notification
        showAlert(data.text,'modal-helper-green');
        $('#modal-link').modal('hide');
      });
}

  /**
   * action de suppresion d'un lien
   * @param  {int} linkId
   */
   $scope.deleteLink = function(linkId){
    $http.get('?c=links&a=data_delete&t=' + $scope.token + '&id=' + linkId)
    .success(function(data){
      $('#link-' + linkId).fadeOut(400, function(){
        $scope.nbLinks -=1;
        _nbTags = $scope.tags.length;
        _nbTagsDeleted = data.tags.deleted.length;
        for(var i = 0; i < _nbTags; ++i){
          for(var j = 0; j < _nbTagsDeleted; ++j){
            if(data.tags.deleted[j].id == $scope.tags[i].id){
              $scope.tags[i].count -= 1;
              break;
            }
          }
        }
        $scope.$apply()
        $(this).remove();
        showAlert(data.text, 'modal-helper-green');
      });
    });
  };

  /**
   * édition d'un tag
   * @param  {int} tagId 
   */
   $scope.editTag = function(tagId){
    $http.get('?c=tags&a=data_form&tagId=' + tagId)
    .success(function(data){
      $scope.formDataTag.label = data.label;
      $scope.formDataTag.id = data.id;
    });
  };

  /**
   * soumission du formulaire d'édition d'un tag
   */
   $scope.submitTag = function(){
    $http.post('?c=tags&a=data_saved&tagId=' + $scope.formDataTag.id, $scope.formDataTag)
    .success(function(data){
      if(data.saved){
        //MAJ le dom
        _nbTags = $scope.tags.length;
        for(var i = 0; i < _nbTags; ++i){
          if($scope.formDataTag.id == $scope.tags[i].id){
            $scope.tags[i].label = data.tag.label;
            break;
          }
        }
        $('.link-tag-' + $scope.formDataTag.id + ' .tag-label ').each(function(){
          $(this).html(data.tag.label);
        });
        showAlert(data.text,'modal-helper-green');
      }else{
        showAlert(data.text,'modal-helper-red');
      }
    });
    $('#modal-tag').modal('hide');
  };

  /**
   * chercher les liens identifiés par les tags
   * @param  {array} tags : tableau des tags sélectionnés
   * @return {object} objet contenant les liens recherchés + le nombre de page de la recherche + le nombre de lien trouvés
   */
   $scope.getLinksByTags = function(tags){
    $http.get('?c=links&a=data_getLinksByTags&tagsId=' + tags.toString())
    .success(function(data){
      if(data.error){
        showAlert(data.text,'modal-helper-red');
      }else{
        $scope.links = data.links;
        $scope.limit = data.nbPages;
        $scope.pagination = 'tags';
        $scope.moreLinks = true;
        $scope.nbLinks = data.nbLinks;
      }
    });
  };

  /**
   * chercher les liens contenant le(s) tag(s) sélectionné(s)
   * @param  {int} tagId
   */
   $scope.selectTag = function(tagId){
    //si une recherche a été effectuée
    if($scope.search) $scope.search = undefined;
    //on vérifie que le lien n'est pas déjà dans la barre de recherche
    var nbTags = $scope.tagsSelected.length;
    //si il y a plus de trois tags sélectionnés on remplace le dernier
    var find = false;
    var tags = [];
    for(var i = 0; i < nbTags; ++i){
      if($scope.tagsSelected[i].id === tagId){
        find = true;
      }
      tags.push($scope.tagsSelected[i].id);
    }
    if(!find){
        //on ajoute le tag à la barre de recherche
        $http.get('?c=tags&a=data_get&tagId=' + tagId)
        .success(function(data){
          if(nbTags < 3){
            $scope.tagsSelected.push(data);
            //on ajoute la classe css 
            $('#tag-' + tagId + ' .tag-label').addClass('tags-active');
          }
          tags.push(tagId);
          //on cherche les liens
          $scope.getLinksByTags(tags);
        });
      }
      
    };

  /**
   * chercher les liens pour la page suivante
   */
   $scope.nextPage = function(){
    $scope.currentPage += 1;
    //si on est arrivé à la limite
    if ($scope.currentPage > $scope.limit) {
      $scope.moreLinks = false;
    } else {
      switch ($scope.pagination) {
        //cas tous les liens
        case 'default':
        $http.get('?c=links&a=data_all&page=' + $scope.currentPage)
        .success(function(data){
          $scope.links = $scope.links.concat(data.links);
        });
        break;
        //cas pour la sélections de tags
        case 'tags':
        $http.get('?c=links&a=data_getLinksByTag&page=' + $scope.currentPage + '&tagId=' + $scope.tagsSelected)
        .success(function(data){
          $scope.links = $scope.links.concat(data.links);
        });
        break;
        //cas pour la recherche
        case 'search':
        $http.get('?c=links&a=data_search&page=' + $scope.currentPage + '&search=' + $scope.search)
        .success(function(data){
          $scope.links = $scope.links.concat(data.links);
        });
        break;
      }
    }
  };

  /**
   * soumission du formulaire de recherche
   * @return {object} 
   */
   $scope.submitSearch = function(){
    //la recherche avec des tags sélectionnés n'est pas implémentée
    var _nbTagsSelected = $scope.tagsSelected.length;
    for(var i = 0; i < _nbTagsSelected; ++i){
      $('#tag-' + $scope.tagsSelected[i].id + ' .tag-label').removeClass('tags-active');
    }
    $scope.tagsSelected = [];


    $scope.search = $scope.formDataSearch.search;
    $('#input-search').blur();
    $http.post('?c=links&a=data_search', $scope.formDataSearch)
    .success(function(data){
      $scope.pagination = 'search';
      $scope.links = data.links;
      $scope.limit = data.nbPages;
      $scope.moreLinks = true;
      $scope.nbLinks = data.nbLinks;
    });
  };

  /**
   * supprimer la recherche
   */
   $scope.removeSearch = function(){
    $scope.search = undefined;
    $('#input-search').val('').blur();
    //on cherche tous les tags
    $scope.getLinks();
  };

  /**
   * supprimer le tag des tags sélectionnés
   * @param  {int} tagId
   */
   $scope.removeSelectedTag = function(tagId){
    //s'il reste des tags sélectionnés
    if($scope.tagsSelected.length > 1){
      var nbTags = $scope.tagsSelected.length;
      var tags = [];
      var indexTagToDelete = 0;
      for(var i = 0; i < nbTags; ++i){
        if($scope.tagsSelected[i].id === tagId){
          //on récupère l'index de la valeur à supprimer
          indexTagToDelete = i;
        }else{
          tags.push($scope.tagsSelected[i].id);
        }
      }
      //on supprime le tag du tableau
      $scope.tagsSelected.splice(indexTagToDelete,1);
      //on cherche les liens
      $scope.getLinksByTags(tags);

      //s'il n'y a pas d'autre tag, on va chercher tous les liens
    }else{
      $scope.tagsSelected = [];
      $scope.getLinks();
    }
    $('#tag-' + tagId + ' .tag-label').removeClass('tags-active');
  };

  $scope.sortTagsList = function(){
    if(!$scope.sort){
      $scope.sort = 'label';
    }else{
      if($scope.sort == 'label'){
        $scope.sort = '-count';
      }else{
        $scope.sort = 'label';
      }
    }
  }

  /* EVENT HANDLERS
  ================================================== */

  //The httpInterceptor will send a message when the loader should be displayed
  $scope.$on('loaderShow', function () {
    $scope.showLoader = true;
  });

  //The httpInterceptor will send a message when the loader should be hidden
  $scope.$on('loaderHide', function () {
    $scope.showLoader = false;
  });
}]);

/**
 * install controller
 * 
 **/
 app.controller('installCtrl', ['$scope', '$http', '$window', function($scope, $http, $window){

  $scope.formDataInstall = {};

  $scope.submitInstall = function(){
    $http.post('?c=users&a=data_savedInstall', $scope.formDataInstall)
    .success(function(data){
      if(data.saved){
        $window.location.href = '.';
      }else{
        showAlert(data.text,'modal-helper-red');
      }
    });
  };
}]);

 app.controller('loginCtrl', ['$scope', '$http', '$window', function($scope, $http, $window){

  $scope.formDataLogin = {};

  $scope.submitLogin = function(){
    $http.post('?c=users&a=data_auth', $scope.formDataLogin)
    .success(function(data){
      if(data.error){
        reset('#formLogin');
        $('#inputToFocus').focus();
        showAlert(data.text,'modal-helper-red');
      }else{
        $window.location.href = '.';
      }
    });
  };
}]);

 app.controller('preferencesCtrl', ['$scope', '$http', function($scope, $http){

  $scope.formDataPassword = {};

  $scope.submitPassword = function(){
    $http.post('?c=account&a=data_savedPassword', $scope.formDataPassword)
    .success(function(data){
      if(data.saved){
        reset('#formPassword');
        showAlert(data.text,'modal-helper-green');
      }else{
        showAlert(data.text,'modal-helper-red');
      }
    });
  };
}]);


 app.controller('usersCtrl', ['$scope', '$http', function($scope, $http){
  $scope.users = [];
  $scope.token = '';
  $scope.idUserToDelete = null;
  $scope.formDataDeleteUser = {};
  $scope.formDataUser = {};
  /**
   * on cherche les utilisateurs 
   */
   $scope.getUsers = function(){
    $http.get('?c=administration&a=data_getUsers')
    .success(function(data){
      $scope.users = data.users;
      $scope.token = data.token;
    });
  };
  //on initialise le scope
  $scope.getUsers();

  /**
   * soumission du formulaire d'un nouvel utilisateur
   */
   $scope.submitUser = function(){
    $http.post('?c=users&a=data_createUser', $scope.formDataUser)
    .success(function(data){
      if(data.saved){
        showAlert(data.text,'modal-helper-green');
        $scope.users.push(data.user);
      }else{
        showAlert(data.text,'modal-helper-red');
      }
    });
    reset('#form-new-user');
  };
  
  $scope.confirmDelete = function(idUser){
    $scope.idUserToDelete = idUser;
  }
  
  $scope.deleteUser = function(){
    $('#modal-delete-user').modal('hide');
    $scope.formDataDeleteUser.idUser = $scope.idUserToDelete;
    $scope.formDataDeleteUser.token = $scope.token;
    $http.post('?c=administration&a=data_deleteUser', $scope.formDataDeleteUser)
    .success(function(data){
      if(data.error){
        showAlert(data.text,'modal-helper-red');
      }else{
        showAlert(data.text,'modal-helper-green');
        var _nbUsers = $scope.users.length;
        for(var _i = 0; _i < _nbUsers; ++_i){
          if($scope.users[_i].id == $scope.idUserToDelete){
            $scope.users.splice(_i, 1);
            break;
          }
        }
      }
    });
    $scope.formDataDeleteUser = {};
  }
}]);