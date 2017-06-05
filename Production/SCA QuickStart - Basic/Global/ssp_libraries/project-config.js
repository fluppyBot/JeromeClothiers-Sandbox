/*
 * Must also be valid JSON object after the ' = ', in order to work locally
 * Don't panic, new Object() is used instead of brackets for local parsing purposes
 * Therefore, DON'T USE BRACKETS BEFORE OR AFTER THE CONFIG ONES
 */
var SC = SC || new Object();
SC.projectConfig = {
    "local": {
        "host": "localhost/",
        "folder": "Jerome/",
        "hosting_folder": "Hosting Files/"
    },
    "hosting_files_folder": "Live Hosting Files",
    "urlroots": {
        "global": "global",
        "shopflow": "shopflow",
        "myaccount": "myaccount",
        "checkout": "checkout",
        "global-core": "global-core",
        "shopflow-core": "shopflow-core",
        "myaccount-core": "myaccount-core",
        "checkout-core": "checkout-core"
    },
    "site": {
        "categories": {
            "enable": true,
            "home_id": -111,
            "secure_enable": true,
            "secure_enable_subcategories": true
        },
        "content": {
            "enable": true,
            "secure_enable": true
        }
    },
    "precedences": {
        "global": [
            "SCA QuickStart - Basic/Global/"
        ],
        "shopflow": [
            "SCA QuickStart - Reference/Reference ShopFlow 1.05.1/",
            "SCA QuickStart - Core/Global/",
            "SCA QuickStart - Core/ShopFlow/",
            "SCA QuickStart - Basic/Global/",
            "SCA QuickStart - Basic/ShopFlow/"
        ],
        "myaccount": [
            "SCA QuickStart - Reference/Reference My Account 1.04.1/",
            "SCA QuickStart - Core/Global/",
            "SCA QuickStart - Core/MyAccount/",
            "SCA QuickStart - Basic/Global/",
            "SCA QuickStart - Basic/MyAccount/"
        ],
        "checkout": [
            "SCA QuickStart - Reference/Reference Checkout 2.03.1/",
            "SCA QuickStart - Core/Global/",
            "SCA QuickStart - Core/Checkout/",
            "SCA QuickStart - Basic/Global/",
            "SCA QuickStart - Basic/Checkout/"
        ],
        "global-core": [
            "SCA QuickStart - Core/Global/"
        ],
        "shopflow-core": [
            "SCA QuickStart - Core/ShopFlow/"
        ],
        "myaccount-core": [
            "SCA QuickStart - Core/MyAccount/"
        ],
        "checkout-core": [
            "SCA QuickStart - Core/Checkout/"
        ]
    },
    "combiners": {
        "suitelet": {
            "script": "customscript_ns_sca_trigger_combiners",
            "deploy": "customdeploy_ns_sca_trigger_combiners"
        },
        "publisher": "SCA QuickStart - Basic",
        "applications": {
            "shopflow" : {
                "folder": "ShopFlow",
                "combine": ["js", "js/libs", "skins/standard", "templates"]
            },
            "myaccount" : {
                "folder": "MyAccount",
                "combine": ["js", "skins/standard", "templates"]
            },
            "checkout" : {
                "folder": "Checkout",
                "combine": ["js", "skins/standard", "templates"]
            }
        },
        "password": {
            "required": true,
            "value": "123456!"
        }
    }
};