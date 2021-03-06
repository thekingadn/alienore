<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="">
    <meta name="author" content="">

    <title><?php echo Config\App::NAME; ?> - <?php echo \MVC\Language::T('Home'); ?></title>

    <!-- Bootstrap core CSS -->
    <link href="<?php echo \Config\Path::CSS; ?>bootstrap.min.css" rel="stylesheet">
    <!-- Application CSS -->
    <link href="<?php echo \Config\Path::CSS; ?>main.min.css" rel="stylesheet">
    <link rel="icon" type="image/png" href="<?php echo \Config\Path::IMG; ?>favicon.png" />
</head>
<body ng-app="alienore">
    <aside class="sidebar">
        <div class="table">
            <div class="row">
                <!-- Menu + logo -->
                <header class="nav">
                    <a href=".">
                        <img id="logo" src="<?php echo \Config\Path::IMG; ?>logo.png"></img>
                    </a>
                    <div class="pull-right" id="nav">
                       <ul>
                        <li id="dropdown-account" class="dropdown">
                            <span style="text-decoration:none" class="pointer" class="dropdown-toggle" data-toggle="dropdown">
                                <?php echo $_SESSION['login'] ?> <span class="glyphicon glyphicon-chevron-down"></span>
                            </span>
                            <ul class="dropdown-menu">
                                <li><a href="."><span class="glyphicon glyphicon-home"></span> <?php echo \MVC\Language::T('Home'); ?></a></li>
                                <li>
                                    <a href="?c=tools&a=all">
                                        <span class="glyphicon glyphicon-wrench"></span> <?php echo \MVC\Language::T('Tools'); ?>
                                    </a>
                                </li>
                                <!--<li>
                                    <a href="?c=account&a=help">
                                        <span class="glyphicon glyphicon-question-sign"></span> <?php echo \MVC\Language::T('Help'); ?>
                                    </a>
                                </li>-->
                                <li>
                                    <a href="?c=account&a=preferences">
                                        <span class="glyphicon glyphicon-cog"></span> <?php echo \MVC\Language::T('Preferences'); ?>
                                    </a>
                                </li>
                                <?php if($_SESSION['admin']): ?>
                                    <li role="presentation" class="divider"></li>
                                    <li><a href="?c=administration&a=users"><span class="glyphicon glyphicon-user"></span> <?php echo \MVC\Language::T('Users'); ?></a></li>
                                <?php endif; ?>
                                <li role="presentation" class="divider"></li>
                                <li><a href="?c=users&a=logout"><?php echo \MVC\Language::T('Logout'); ?></a></li>  
                            </ul>
                        </li>
                    </ul>
                </div>
            </header>
        </div>
        <div class="row collections-list">
        </div>
        <div class="row">
            <div class="footer">
                <?php echo \MVC\Language::T('Version') .' '. \Config\App::VERSION ?>
            </div>
        </div>
    </div>
</aside>
<div class="wrap">
    <h3><?php echo \MVC\Language::T('Export') ?> :</h3>
    <div class="tool-body">
        <button class="btn btn-default" onclick="location.href = '?c=tools&a=exportHtml'">
            <?php echo \MVC\Language::T('Export to html format') ?>
        </button>
    </div>
    <h3><?php echo \MVC\Language::T('Import') ?> :</h3>
    <div class="tool-body">
        <form id="form-import" action="?c=tools&a=import" method="post" enctype="multipart/form-data">
            <input type="file" name="filePath">                        
            <input type="hidden" name="MAX_FILE_SIZE" value="100000"><br>
            <button type="submit" class="btn btn-primary">
                <?php echo \MVC\Language::T('Submit'); ?>
            </button>
        </form>
    </div>
</div>
<script src="<?php echo \Config\Path::JS; ?>jquery.js"></script>
<script src="<?php echo \Config\Path::JS; ?>bootstrap.min.js"></script>
<script src="<?php echo \Config\Path::JS; ?>tagging.min.js"></script>
<script src="<?php echo \Config\Path::JS; ?>perso.js"></script>
<script src="<?php echo \Config\Path::JS; ?>angular.min.js"></script>
<script src="<?php echo \Config\Path::JS; ?>app.angular.min.js"></script>
</body>
</html>