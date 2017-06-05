/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       08 Jul 2014     jcrisostomo
 *
 */

var psg_dm;
if (!psg_dm) { psg_dm = {}; }

/**
 * This checks if the netsuite version is 2014.2 or greater 
 * @returns {boolean} true if the version
 */
psg_dm.isNewUI = function(){
	var version = nlapiGetContext().getVersion();
	var verYr = parseInt(version.split()[0]);

	if (version == '2014.2' || verYr > 2014) {
		return true;
	}
	else {
		return false;
	}
};
