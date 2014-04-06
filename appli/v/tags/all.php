<!DOCTYPE html>
<html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="description" content="">
        <meta name="author" content="">

        <title><?php echo Install\App::NAME; ?> - <?php echo \MVC\Language::T('Tags'); ?></title>

        <!-- Bootstrap core CSS -->
        <link href="<?php echo \Install\Path::CSS; ?>bootstrap.min.css" rel="stylesheet">
        <!-- Application CSS -->
        <link href="<?php echo \Install\Path::CSS; ?>perso.css" rel="stylesheet">
        <link rel="icon" type="image/png" href="<?php echo \Install\Path::IMG; ?>favicon.png" />
    </head>
    <body>
       <div id="header">
            <div class="navbar navbar-inverse navbar-fixed-top" role="navigation">
                <div class="navbar-header">
                    <button type="button" class="navbar-toggle" data-toggle="collapse" data-target=".navbar-collapse">
                        <span class="sr-only">Toggle navigation</span>
                        <span class="icon-bar"></span>
                        <span class="icon-bar"></span>
                        <span class="icon-bar"></span>
                    </button>
                    <a class="navbar-brand" href="."><img class="logo" src="<?php echo \Install\Path::IMG; ?>logo.png"></img></a>
                </div>
                <div class="collapse navbar-collapse">
                    <ul class="nav navbar-nav">
                        <li><a href="."><?php echo \MVC\Language::T('Home'); ?></a></li>
                        <li class="active"><a href="?c=tags&a=all"><?php echo \MVC\Language::T('Tags'); ?></a></li>
                        <li><a href="?c=tools&a=all"><?php echo \MVC\Language::T('Tools'); ?></a></li>
                    </ul>
                    <ul class="nav navbar-nav navbar-right">
                        <li id="dropdown-account" class="dropdown">
                            <a href="#" class="dropdown-toggle" data-toggle="dropdown"><?php echo \MVC\Language::T('Account'); ?><b class="caret"></b></a>
                            <ul class="dropdown-menu">
                                <li><a href="?c=account&a=help"><?php echo \MVC\Language::T('Help'); ?></a></li>
                                <li><a href="?c=account&a=preferences"><?php echo \MVC\Language::T('Preferences'); ?></a></li>
                                <li role="presentation" class="divider"></li>
                                <li><a href="?c=users&a=logout"><?php echo \MVC\Language::T('Logout'); ?></a></li> 
                            </ul>
                        </li>

                    </ul>
                </div><!--/.nav-collapse -->
            </div>    
        </div>
        <div id="addlink">
            <div id="nbTags">
                <?php echo \MVC\Language::T('NbTags') . ' ' . $this->nbTags ?>
            </div>
        </div>
        <div class="paging"></div>
        <div id="tags"><div  class="container">
            <?php $tags = $this->tags; ?>
            <?php if ($this->nbTags > 0): ?>    
            <?php for($i = 0; $i < sizeof($tags); ++$i): ?>
                <span class="tags">
                    <a href="?c=links&a=all&tagId=<?php echo $tags[$i]['tag']->id; ?>">
                        <b style="font-size: <?php echo $tags[$i]['fontSize']; ?>px">
                            <span class="nbLinksByTag"><?php echo $tags[$i]['nbLinks'] ?></span><?php echo $tags[$i]['tag']->label; ?>
                        </b>
                    </a>
                </span>
            <?php endfor; ?>
            <?php else : ?>
                <span class="tags"><?php echo $this->helper ; ?></span>
            <?php endif ; ?>
        </div></div>
        <div class="paging"></div>
        <div id="footer">
            <?php echo \MVC\Language::T('By') ?> <?php echo \Install\App::COPYRIGHT ?> - <?php echo \Install\App::VERSION ?> 
        </div>
        <script src="<?php echo \Install\Path::JS; ?>jquery.js"></script>
        <script src="<?php echo \Install\Path::JS; ?>bootstrap.min.js"></script>
        <script src="<?php echo \Install\Path::JS; ?>keymaster.js"></script>
        <script src="<?php echo \Install\Path::JS; ?>perso.js"></script>
    </body>
</html>

