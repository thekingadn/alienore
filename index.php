<?php

define('MVC', 'mvc/');
define('INSTALL', 'install/');

//load language
include MVC . 'language.php';
include INSTALL . 'app.php';
include INSTALL . 'path.php';
\MVC\Language::loadLanguage();

//index
include(MVC . 'index.php');