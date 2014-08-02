'use strict';

var ConfigParser	= require( './ConfigParser' ),
	FileScanner		= require( './FileScanner' ),
	path			= require( 'path' ),
	mkdirp			= require( 'mkdirp' ),
	cp				= require( 'cp' ),
	fs				= require( 'fs' ),
	gm				= require( 'gm' ),
	zlib			= require( 'zlib' );


/**
 *
 * @param {object} options
 * @constructor
 */
var ImageReducer = function( options )
{
	var configParser	= new ConfigParser( ImageReducer.supportedOptions );
	this.options		= configParser.getOptions( options );

	this.stats = {
		files : {
			total		: 0,
			optimized	: 0,
			copied		: 0,
			ignored		: 0
		},

		dirs : {
			total		: 0
		},

		data : {
			original	: 0,
			optimized	: 0
		}
	};
};


/**
 * @private
 */
ImageReducer.supportedOptions = {
		destPath						: { type: 'string', required: true },
		directColorBitDepth				: { type: 'int', options: [ 1, 4, 8, 15, 16, 18, 24, 32 ] },
		flexibleFormat					: 'boolean',
		forceDirectColorOutputFormat	: { type: 'string', options: [ 'jpg', 'gif', 'png', 'webp' ] },
		forceIndexedColorOutputFormat	: { type: 'string', options: [ 'jpg', 'gif', 'png', 'webp' ] },
		forcePngToIndexed				: 'boolean',
		forcePngToJpg					: 'boolean',
		indexedColorBitDepth			: { type: 'int', min: 1, max: 8 },
		jpegBlur						: 'double',
		maxHeight						: { type: 'int', min: 1 },
		maxWidth						: { type: 'int', min: 1 },
		minSizeReduction				: { type: 'int', min: 0, max: 100 },
		quality							: { type: 'int', min: 0, max: 100 },
		recursive						: 'boolean',
		sourcePath						: { type: 'string', required: true },
		verbose							: 'boolean'
	};

/**
 * @private
 */
ImageReducer.supportedExtensions = {
	'.gif'	: true,
	'.jpg'	: true,
	'.jpeg'	: true,
	'.png'	: true,
	'.svg'	: true
};



ImageReducer.prototype = {

	/**
	 * Process images
	 *
	 * @param {Function} callbackFunction
	 * @public
	 */
	run : function( callbackFunction )
	{
		var reducer	= this;

		var scanner = new FileScanner(
				this.options.sourcePath,
				this.eventProcessFile(),
				this.eventProcessDir(),
				this.eventScanComplete( callbackFunction ),
				this.options.recursive
			);

		mkdirp(
				this.options.destPath,
				function( err )
				{
					if( err )
					{
						reducer.log( 'Error: ' + err.message );
						return callbackFunction( err );
					}

					scanner.scan();
				}
			);
	},


	/**
	 * Process a file
	 *
	 * @returns {Function}
	 * @private
	 */
	eventProcessFile : function()
	{
		var reducer = this;

		return function( fileInfo, next )
		{
			reducer.stats.files.total++;
			reducer.stats.data.original += fileInfo.size;

			reducer.log( 'File: ' + fileInfo.fullPath );

			fileInfo.targetFile = path.join( reducer.options.destPath, fileInfo.relativePath, fileInfo.filename );

			if( reducer.isSupportedExtension( fileInfo.extensionLower ) === false )
			{
				reducer.log( '    => Non-supported extension: ' + fileInfo.extension );
				reducer.stats.files.ignored++;
				return next();
			}

			if( fileInfo.extensionLower === '.svg' )
			{
				return reducer.manageSvg( fileInfo, next );
			}

			reducer.manageImage( fileInfo, next );
		};
	},


	/**
	 * Process a directory
	 *
	 * @private
	 * @returns {Function}
	 */
	eventProcessDir : function()
	{
		var reducer = this;

		return function( fileInfo, next )
		{
			reducer.stats.dirs.total++;

			mkdirp(
					path.join( reducer.options.destPath, fileInfo.relativePath, fileInfo.basename ),
					function( err )
					{
						if( err )
						{
							reducer.log( '    => Error: ' + err.message );
							return next( err );
						}

						next();
					}
				);
		};
	},


	/**
	 * Finish processing
	 *
	 * @param {Function} callbackFunction
	 * @returns {Function}
	 * @private
	 */
	eventScanComplete : function( callbackFunction )
	{
		var reducer = this;

		return function( err )
		{
			callbackFunction( err, reducer.stats );
		};
	},


	/**
	 * Write to console
	 *
	 * @param {string} message
	 * @private
	 */
	log : function( message )
	{
		if( this.options.verbose === true )
		{
			console.log( message );
		}
	},


	/**
	 * Determine ideal image size
	 *
	 * @param {object} imInfo
	 * @returns {{width: number, height: number}}
	 * @private
	 */
	getIdealWidth : function( imInfo )
	{
		var imWidth		= imInfo.size.width,
			imHeight	= imInfo.size.height,
			scale		= false;

		if( this.options.maxWidth )
		{
			if( imWidth > this.options.maxWidth )
			{
				scale		= this.options.maxWidth / imWidth;
				imWidth		= this.options.maxWidth;
				imHeight	*= scale;
			}
		}

		if( this.options.maxHeight )
		{
			if( imHeight > this.options.maxHeight )
			{
				scale		= this.options.maxHeight / imHeight;
				imHeight	= this.options.maxHeight;
				imWidth		*= scale;
			}
		}

		var effectiveScale = ( imWidth / imInfo.size.width ) * 100;

		if( 100 - effectiveScale < this.options.minSizeReduction )
		{
			imWidth		= imInfo.size.width * ( ( 100 - this.options.minSizeReduction ) / 100 );
			imHeight	= imInfo.size.height * ( ( 100 - this.options.minSizeReduction ) / 100 );
		}

		return {
			width	: Math.round( imWidth ),
			height	: Math.round( imHeight )
		};
	},


	/**
	 * Check if file extension is supported by the optimizer
	 *
	 * @param {string} extension
	 * @returns {boolean}
	 * @private
	 */
	isSupportedExtension : function( extension )
	{
		return ( ImageReducer.supportedExtensions[ extension ] === true );
	},


	/**
	 * Optimize SVG file
	 *
	 * Simply gzips the file
	 *
	 * @param {object} fileInfo
	 * @param {Function} next
	 * @private
	 */
	manageSvg : function( fileInfo, next )
	{
		var finalFile	= fileInfo.targetFile + '.gz',
			gzip		= zlib.createGzip( { windowBits: 15, level: 9, memLevel: 9 } ),
			inp			= fs.createReadStream( fileInfo.fullPath ),
			out			= fs.createWriteStream( finalFile ),
			reducer		= this;

		out.on(
				'error',
				function( err )
				{
					reducer.log( '    => Error: ' + err.message );
					next( err );
				}
			);

		inp.on(
				'error',
				function( err )
				{
					reducer.log( '    => Error: ' + err.message );
					next( err );
				}
			);

		out.on(
				'finish',
				function()
				{
					fs.stat(
							finalFile,
							function( err, finalFileInfo )
							{
								if( err )
								{
									return next( err );
								}

								reducer.stats.files.optimized++;
								reducer.stats.data.optimized += finalFileInfo.size;

								next();
							}
						);
				}
			);

		inp.pipe( gzip ).pipe( out );
	},


	/**
	 * Optimize image
	 *
	 * @param {object} fileInfo
	 * @param {Function} next
	 * @private
	 */
	manageImage : function( fileInfo, next )
	{
		var reducer		= this,
			im			= new gm( fileInfo.fullPath );

		im.identify(
				function( err, imInfo )
				{
					if( err )
					{
						reducer.log( '    => Error: ' + err.message );
						return next( err );
					}

					im.type( 'Optimize' );
					im.colorspace( 'RGB' );

					// resize
					var targetSize = reducer.getIdealWidth( imInfo );
					im.resize( targetSize.width, targetSize.height );

					// set color bit depth
					reducer.manageColorDepth( im, imInfo, fileInfo );

					// take out all excess
					im.strip();
					im.noProfile();
					im.flatten();

					// target output format
					var targetFormat = fileInfo.extension;

					// force direct color pngs to jpgs?
					if( ( !imInfo.color ) && ( fileInfo.extensionLower === '.png' ) && ( reducer.options.forcePngToJpg ) )
					{
						targetFormat = '.jpg';
					}

					// compression quality
					reducer.manageCompression( im, targetFormat );

					// write
					var finalFile = path.join( path.dirname( fileInfo.targetFile ), fileInfo.basename + targetFormat );
					im.write( finalFile, reducer.verifyImage( finalFile, fileInfo, next ) );
				}
			);

	},


	/**
	 * Check that optimized file is smaller than the original and use the original if that's not the case
	 *
	 * @param {string} finalFile
	 * @param {object} fileInfo
	 * @param {Function} next
	 * @returns {Function}
	 * @private
	 */
	verifyImage : function( finalFile, fileInfo, next )
	{
		var reducer = this;

		return function( err )
		{
			if( err )
			{
				reducer.log( '    => Error: ' + err.message );
				return next( err );
			}

			fs.stat(
					finalFile,
					function( err, finalFileInfo )
					{
						if( err )
						{
							reducer.log( '    => Error: ' + err.message );
							return next( err );
						}

						if( finalFileInfo.size < fileInfo.size )
						{
							reducer.stats.data.optimized += finalFileInfo.size;
							reducer.stats.files.optimized++;

							return next();
						}

						reducer.useOriginal( finalFile, fileInfo, next );
					}
				);
		};
	},


	/**
	 * Remove optimized file and use original file instead
	 *
	 * @param {string} finalFile
	 * @param {object} fileInfo
	 * @param {Function} next
	 * @private
	 */
	useOriginal : function( finalFile, fileInfo, next )
	{
		var reducer = this;

		reducer.stats.data.optimized += fileInfo.size;
		reducer.stats.files.copied++;

		fs.unlink(
				finalFile,
				function( err )
				{
					if( err )
					{
						reducer.log( '    => Error: ' + err.message );
						return next( err );
					}

					cp(
							fileInfo.fullPath,
							fileInfo.targetFile,
							next
						);
				}
			);
	},


	/**
	 * Set ideal compression
	 *
	 * @param {gm} im
	 * @param {string} targetFormat
	 * @private
	 */
	manageCompression : function( im, targetFormat )
	{
		if( ( targetFormat === '.jpg' ) || ( targetFormat === '.jpeg' ) )
		{
			if( this.options.jpegBlur )
			{
				im.blur( this.options.jpegBlur, 1 );
			}

			im.samplingFactor( 4, 2 );
		}

		if( ( targetFormat === '.gif' ) || ( targetFormat === '.png' ) )
		{
			im.quality( 100 );
		}
		else
		{
			if( this.options.quality )
			{
				im.quality( this.options.quality );
			}
		}
	},


	/**
	 * Reduce color depth
	 *
	 * @param {gm} im
	 * @param {object} imInfo
	 * @param {object} fileInfo
	 * @private
	 */
	manageColorDepth : function( im, imInfo, fileInfo )
	{
		if( ( !imInfo.color ) && ( this.options.directColorBitDepth ) )
		{
			if( !( ( fileInfo.extension === '.png' ) && ( this.options.forcePngToIndexed ) ) )
			{
				im.bitdepth( this.options.directColorBitDepth );
				im.dither( false );
				im.interlace( 'None' );
				im.colors( Math.pow( this.options.directColorBitDepth, 3 ) );
			}
		}

		if(
			// set bit depth for indexed color images
			( ( imInfo.color ) || ( fileInfo.extension === '.png' ) && ( this.options.forcePngToIndexed ) ) ||
			// override bit depth for PNGs?
			( ( fileInfo.extension === '.png' ) && ( this.options.forcePngToIndexed ) )
		)
		{
			im.bitdepth( this.options.indexedColorBitDepth );
			im.dither( false );
			im.interlace( 'None' );
			im.colors( Math.pow( 2, this.options.indexedColorBitDepth ) );
		}
	}
	

};


module.exports = ImageReducer;


