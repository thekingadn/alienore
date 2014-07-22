/**
 * module pour réaliser un post comme jQuery
 * Plus d'info : http://victorblog.com/2012/12/20/make-angularjs-http-service-behave-like-jquery-ajax/
 */
 angular.module('postModule', [], function($httpProvider) {
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
});

var app = angular.module('alienore', ['postModule']);

/*
* Main controller
* - display the links
* - display the tag list
* - search tool
*
*/
app.controller('mainCtrl', function($scope, $http){

  $scope.currentPage = 1; //page courante
  $scope.limit = 1; //nombre de page
  $scope.search = ''; //dernière recherche
  $scope.pagination = 'default'; //différencier : liens/ liens par tag/ recherche
  $scope.moreLinks = true; //si il y a davantage de liens
  $scope.isTagSelection = false; //si on recherche les liens par tag
  $scope.tagsSelected = [];
  $scope.tags = [];
  $scope.links = [];
  $scope.nbLinks = 0;
  $scope.token = ''; //token de l'utlisateur pour prévenir des failles CSRF
  $scope.formDataLink = {};
  $scope.formDataTag = {};

  $scope.getLinks = function(){
    //on cherche les lens à afficher
    $http.get('?c=links&a=data_all')
    .success(function(data){
      $scope.links = data.links;
      $scope.limit = data.nbPages;
      $scope.token = data.token;
      $scope.nbLinks = data.nbLinks;
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

/**
 * action édition d'un lien
 * @param  {int} linkId 
 * @param  {string} editString : titre à remplacer dans la modal
 */
$scope.editLink = function(linkId, editString){
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
 * action submit the form
 * @return {object} retourne le lien + les tags
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
      var _nbAddedTags = data.tags.added;
      for(var i = 0; i < _nbAddedTags; ++i){
        _tagsLink.push({label : data.tags.added[i].label, id : data.tags.added[i].id});
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
      updateTags(data.tags);

      // édition d'un lien
    }else{
      //todo MAJ du lien
      var $link = $('#link-' + $scope.formDataLink.id);
      $link.find('.title-url').attr("href",data.link.url);
      $link.find('.title-url').attr("src","http://www.google.com/s2/favicons?domain=" + data.link.url);
      $link.find('.title').html(data.link.title);
      $link.find('.link-url').html(data.link.url);
      $link.find('.link-description').html(data.link.description);

      //todo affichage des tags

      //MAJ des tags
      updateTags(data.tags);
      var _nbNewTags = data.tags.new.length;
      for( var i = 0; i < _nbNewTags; ++i){
        $scope.tags.push({
          'count' : 1,
          'label' : data.tags.new[i].label, 
          'id' : data.tags.new[i].id
        });
      }
    }
    showAlert(data.error,'modal-helper-green');
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
            $(this).remove();
            showAlert(data.error, 'modal-helper-green');
        });
    });
};

/**
 * édition d'un tag
 * @param  {int} tagId 
 */
$scope.editTag = function(tagId){
  console.log(tagId);
};

$scope.getLinksByTags = function(tags){
  $http.get('?c=links&a=data_getLinksByTags&tagsId=' + tags.toString())
  .success(function(data){
    $scope.links = data.links;
    $scope.limit = data.nbPages;
    $scope.pagination = 'tags';
    $scope.moreLinks = true;
    $scope.isTagSelection = true;
    $scope.nbLinks = data.nbLinks;
});
};

/**
 * chercher les liens contenant le tag sélectionné
 * @param  {int} tagId
 */
 $scope.selectTag = function(tagId){
    //on vérifie que le lien n'est pas déjà dans la barre de recherche
    var nbTags = $scope.tagsSelected.length;
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
          $scope.tagsSelected.push(data);
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
        case 'default':
        $http.get('?c=links&a=data_all&page=' + $scope.currentPage)
        .success(function(data){
          $scope.links = $scope.links.concat(data.links);
      });
        break;
        case 'tags':
        $http.get('?c=links&a=data_getLinksByTag&page=' + $scope.currentPage + '&tagId=' + $scope.tagsSelected)
        .success(function(data){
          $scope.links = $scope.links.concat(data.links);
      });
        break;
        case 'search':
        $http.get('?c=links&a=data_search&page=' + $scope.currentPage + '&search=' + $scope.search)
        .success(function(data){
          $scope.links = $scope.links.concat(data.links);
      });
        break;
    }
}
};

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
};

});