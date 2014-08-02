'use strict';

var fs		= require( 'fs' ),
	path	= require( 'path' );


/**
 * Scans through all files on the specified path and calls
 * `fileCallbackFunction` for each file (directories are omitted).
 *
 * Process is serial (one file at a time); at the end of the process
 * `completeFunction( err )` is called with `err` set on failure,
 * undefined on success.
 *
 * `fileCallbackFunction` should accept one parameter, `fileInfo`:
 *
 * <code>
 * fileInfo = {
 *		size			: 234, // size in bytes
 *		extension		: '.txt', // filename extension
 *		basename		: 'readme', // filename without extension
 *		dirname			: '/tmp/my/scanner/files', // full path name of the directory
 *		filename		: 'readme.txt', // filename
 *		fullPath		: '/tmp/my/scanner/files/readme.txt', // full path name of the file
 *		relativePath	: 'files/readme.txt' // relative path to file from the root scanning path
 *	};
 * </code>
 *
 * Usage:
 *
 * <code>
 *     var scanner = new FileScanner( '/tmp/my/scanner', myCallbackFn, myCompleteFn, true );
 *
 *     scanner.scan();
 * </code>
 *
 * @param {string} path
 * @param {Function|null} fileCallbackFunction
 * @param {Function|null} dirCallbackFunction
 * @param {Function} completeFunction
 * @param {boolean} recursive
 * @constructor
 */
var FileScanner = function( path, fileCallbackFunction, dirCallbackFunction, completeFunction, recursive )
{
	this.path					= path;
	this.fileCallbackFunction	= fileCallbackFunction;
	this.dirCallbackFunction	= dirCallbackFunction;
	this.completeFunction		= completeFunction;
	this.recursive				= recursive || false;
	this.originPath				= path;
};


FileScanner.prototype = {

	/**
	 * Scan for files
	 * @public
	 */
	scan : function()
	{
		var scanner = this;

		fs.readdir(
				this.path,
				function( err, files )
				{
					scanner.serialScan( err, files );
				}
			);
	},


	/**
	 * Create a function for managing 'complete' notifications for subdir scans
	 *
	 * @param {Function} next
	 * @returns {Function}
	 * @private
	 */
	subDirComplete : function( next )
	{
		var scanner = this;

		return function( err )
		{
			if( err )
			{
				scanner.completeFunction( err );
				return;
			}

			next();
		};
	},


	/**
	 * Create and run scanner for a subdir scan
	 *
	 * @param {string} subPath
	 * @param {Function} next
	 * @private
	 */
	scanSubDirectory : function( subPath, next )
	{
		var fileScanner = new FileScanner(
				subPath,
				this.fileCallbackFunction,
				this.dirCallbackFunction,
				this.subDirComplete( next ),
				true
			);

		fileScanner.originPath = this.originPath;

		fileScanner.scan();
	},


	/**
	 * Iterate serially through a list of files
	 *
	 * @param {*} err
	 * @param {string[]} files
	 * @private
	 */
	serialScan : function( err, files )
	{
		var i			= -1,
			scanner		= this,
			complete	= scanner.completeFunction;

		if( err )
		{
			complete( err );
			return;
		}

		var next = function()
		{
			i++;

			if( i >=  files.length )
			{
				complete();
				return;
			}

			if( ( files[ i ] === '.' ) || ( files[ i ] === '..' ) )
			{
				next();
				return;
			}

			var fileName = path.join( scanner.path, files[ i ] );

			fs.stat( fileName, scanner.processFile( fileName, files[ i ], next, complete ) );
		};

		next();
	},


	/**
	 * Process directory in file list
	 *
	 * @param {string} fileName
	 * @param {Function} next
	 * @param {string} shortFileName
	 * @private
	 */
	processDir : function( fileName, next, shortFileName )
	{
		var scanner = this;

		if( scanner.dirCallbackFunction )
		{
			scanner.dirCallbackFunction.call(
					undefined,
					{
						extension		: path.extname( fileName ),
						extensionLower	: path.extname( fileName ).toLowerCase(),
						basename		: path.basename( fileName, path.extname( fileName ) ),
						dirname			: path.dirname( fileName ),
						filename		: shortFileName,
						fullPath		: fileName,
						relativePath	: path.dirname( fileName ).substr( scanner.originPath.length )
					},
					function()
					{
						if( scanner.recursive === true )
						{
							scanner.scanSubDirectory( fileName, next );
						}
						else
						{
							next();
						}
					}
				);
		}
		else
		{
			if( scanner.recursive === true )
			{
				scanner.scanSubDirectory( fileName, next );
			}
			else
			{
				next();
			}
		}
	},


	/**
	 * Determine what to do with a file
	 * 
	 * @param {string} fileName
	 * @param {string} shortFileName
	 * @param {Function} next
	 * @param {Function} complete
	 * @returns {Function}
	 * @private
	 */
	processFile : function( fileName, shortFileName, next, complete )
	{
		var scanner = this;

		return function( err, fileStat )
		{
			if( err )
			{
				complete( err );
				return;
			}

			if( fileStat.isDirectory() === true )
			{
				scanner.processDir( fileName, next, fileStat );
			}
			else if( fileStat.isFile() === true )
			{
				scanner.fileCallbackFunction.call(
						undefined,
						{
							size			: fileStat.size,
							extension		: path.extname( fileName ),
							extensionLower	: path.extname( fileName ).toLowerCase(),
							basename		: path.basename( fileName, path.extname( fileName ) ),
							dirname			: path.dirname( fileName ),
							filename		: shortFileName,
							fullPath		: fileName,
							relativePath	: path.dirname( fileName ).substr( scanner.originPath.length )
						},
						next
					);
			}
			else
			{
				// we don't care about these files
				next();
			}
		};
	}

};


module.exports = FileScanner;

