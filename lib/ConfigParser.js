'use strict';


/**
 * Manage and validate configuration options
 *
 * `configDescription` is an object which must contain a property for each accepted configuration option.
 *
 * The configuration options can be either a string describing the accepted data type
 * (string, boolean, int, double), or a description object:
 *
 * <code>
 * var descObject = {
 * 		type		: 'int', // string, boolean, int, double -- required
 * 		required	: true, // If set to true, option must be present
 * 		min			: 20, // If present, option value may not be less than this
 *		max			: 50, // If present, option value may not be more than this
 *		options		: [ 20, 30, 40, 50 ], // If present, option value must be found from this array
 * }
 * </code>
 *
 * Usage:
 *
 * <code>
 * var configParser = new ConfigParser(
 * 			{
 * 				version	: 'string',
 * 				file    : { type: 'string', required: true }
 * 			}
 *		);
 *
 * validatedOptions = configParser.getOptions( { file: 'a.txt', version: 'alpha' } );
 * </code>
 *
 * @param {object} configDescription
 * @constructor
 */
var ConfigParser = function( configDescription )
{
	/**
	 * @private
	 */
	this.configDescription = configDescription;
};


ConfigParser.prototype = {

	/**
	 * Import options and convert command-line-arguments to camel case
	 *
	 * @public
	 * @param {object} options
	 * @returns {object} Imported options
	 */
	getOptions: function( options )
	{
		var importedOptions = {};

		for( var o in options )
		{
			if( options.hasOwnProperty( o ) === true )
			{
				var optionName = o.replace( /\-\w/g, this.camelCaseText );

				if( this.configDescription.hasOwnProperty( optionName ) === true )
				{
					importedOptions[ optionName ] = this.processOption( options[ o ], this.configDescription[ optionName ], optionName );
				}
				else
				{
					if( o.substr( 0, 1 ) !== '_' )
					{
						throw new Error( 'Unknown option "' + o + '"' );
					}
				}
			}
		}

		this.checkRequiredParameters( importedOptions );

		return importedOptions;
	},


	/**
	 * @private
	 * @param {object} options
	 */
	checkRequiredParameters : function( options )
	{
		for( var o in this.configDescription )
		{
			if(
					( this.configDescription.hasOwnProperty( o ) === true ) &&
					( this.configDescription[ o ] ) &&
					( typeof this.configDescription[ o ] === 'object' ) &&
					( this.configDescription[ o ].required === true ) &&
					( options.hasOwnProperty( o ) === false )
			)
			{
				throw new Error( 'Required option missing: "' + o + '"' );
			}
		}
	},


	/**
	 * Validate and format option value
	 *
	 * @param {string|int|boolean|Number} optionValue
	 * @param {object|string} optionDescription
	 * @param {string} optionName
	 * @returns {string|int|boolean|Number}
	 * @private
	 */
	processOption : function( optionValue, optionDescription, optionName )
	{
		var optDesc = optionDescription;

		if( typeof optionDescription === 'string' )
		{
			optDesc = { type: optionDescription };
		}

		if( !optDesc.type )
		{
			throw new Error( '"' + optionName + '" has no specified type' );
		}

		var formattedOptionValue = this.formatOptionValue( optDesc, optionValue, optionName );

		this.validateOption( optDesc, formattedOptionValue, optionName );

		return formattedOptionValue;
	},


	/**
	 * Format option value
	 *
	 * @param {object} optDesc
	 * @param {string|int|boolean|Number} optionValue
	 * @param {string} optionName
	 * @private
	 * @returns {string|int|boolean|Number}
	 */
	formatOptionValue : function( optDesc, optionValue, optionName ) // jshint ignore:line
	{
		var formattedOptionValue = optionValue;

		switch( optDesc.type )
		{
			case 'string':
			case 'str':
			case 's':
				// all good
				break;

			case 'boolean':
			case 'bool':
			case 'b':
				formattedOptionValue = ( [ 'true', true, 1, -1, 'y', 'yes', 't' ].indexOf( optionValue ) >= 0 );
				break;

			case 'int':
			case 'long':
			case 'i':
			case 'l':
				formattedOptionValue = parseInt( optionValue, 10 );
				break;

			case 'float':
			case 'double':
			case 'f':
			case 'd':
				formattedOptionValue = parseFloat( optionValue );
				break;

			default:
				throw new Error( '"' + optionName + '" has an unknown type: ' + optDesc.type );
		}

		return formattedOptionValue;
	},


	/**
	 * Validate option value
	 *
	 * Throws if invalid.
	 *
	 * @param {object} optDesc
	 * @param {string|int|boolean|Number} formattedOptionValue
	 * @param {string} optionName
	 * @private
	 */
	validateOption : function( optDesc, formattedOptionValue, optionName )
	{
		if( optDesc.hasOwnProperty( 'min' ) === true )
		{
			if( formattedOptionValue < optDesc.min )
			{
				throw new Error( '"' + optionName + '" may not be less than ' + optDesc.min );
			}
		}

		if( optDesc.hasOwnProperty( 'max' ) === true )
		{
			if( formattedOptionValue > optDesc.max )
			{
				throw new Error( '"' + optionName + '" may not exceed ' + optDesc.max );
			}
		}

		if( optDesc.options )
		{
			var found = false;

			for( var i = 0; ( i < optDesc.options.length ) && ( found === false ); i++ )
			{
				if( optDesc.options[ i ] === formattedOptionValue )
				{
					found = true;
				}
			}

			if( found === false )
			{
				throw new Error( 'Invalid value for "' + optionName +'"' );
			}
		}
	},


	/**
	 * @private
	 * @param {string} txt
	 * @returns {string}
	 */
	camelCaseText: function( txt )
	{
		return txt.charAt( 1 ).toUpperCase();
	}

};



module.exports = ConfigParser;
