'use strict';

var ImageReducer	= require( './lib/ImageReducer' ),
	filesize		= require( 'file-size' ),
	moment			= require( 'moment' );


function printHelp()
{
	console.log(
			'reduce-image --source-path PATH --dest-path PATH [--max-width WIDTH] [--max-height HEIGHT] \\\n' +
			'    [--min-size-reduction 0-100] [--quality 0-100] [--flexible-format] \\\n' +
			'    [--force-direct-color-output-format jpg|png|webp] \\\n' +
			'    [--force-indexed-color-output-format gif|png|webp] \\\n' +
			'    [--direct-color-bit-depth 8|15|16|18|24] [--indexed-color-bit-depth 1-8] \\\n' +
			'    [--force-png-to-indexed] [--force-png-to-jpg] [--recursive] [--verbose]\n' +
			'\n' +
			'See README.md for details.'
		);
}


function printVersion()
{
	console.log( 'Reduce Image Tool 0.0.1' );
	console.log( 'Copyright (c) 2014 Aleksi Asikainen' );
}


function runCli()
{
    var argv = require( 'minimist' )( process.argv.slice( 2 ) );

	if( ( argv.help ) || ( argv.h ) )
	{
		printHelp();
		return;
	}

	if( ( argv.version ) || ( argv.v ) || ( argv.V ) )
	{
		printVersion();
		return;
	}

    if( ( !argv[ 'dest-path' ]  ) || ( !argv[ 'source-path' ] ) )
    {
        printHelp();
	    process.exit( 1 );
    }

    if( ( argv[ 'force-png-to-indexed' ] ) && ( argv[ 'force-png-to-jpg' ] ) )
    {
		throw new Error( "'force-png-to-indexed' and 'force-png-to-jpg' options may not be used together" );
    }

	var imageReducer	= new ImageReducer( argv );
	var startTime		= Date.now();


	imageReducer.run(
			function( err, stats )
			{
				if( err )
				{
					console.error( 'Oh no! ' + err.message );
					process.exit( 1 );
				}

				console.log(
						'\n############### SCAN COMPLETE ###############\n\n' +
						'FILES\n' +
						'    * Scanned:    ' + stats.files.total + '\n' +
						'    * Optimized:  ' + stats.files.optimized + '\n' +
						'    * Copied:     ' + stats.files.copied + '\n' +
						'    * Ignored:    ' + stats.files.ignored + '\n' +
					    '\n' +
						'DATA\n' +
						'    * Original:   ' + filesize( stats.data.original ).human( { jedec: true } ) + '\n' +
						'    * Optimized:  ' + filesize( stats.data.optimized ).human( { jedec: true } )+ '\n' +
						'\n' +
						'SAVING\n' +
						'    * Bytes:      ' + filesize( stats.data.original - stats.data.optimized ).human( { jedec: true } ) + '\n' +
						'    * Percentage: ' + ( ( stats.data.optimized / stats.data.original ) * 100 ).toFixed( 2 ) + '% of original\n' +
						'    * Ratio:      ' + ( ( stats.data.original / stats.data.optimized ) ).toFixed( 2 ) + ':1\n' +
						'\n' +
						'TIME\n' +
						'    * Time taken: ' + moment.duration( Date.now() - startTime ).humanize() + '\n' +
						'    * Processing:  ' +
								( ( stats.data.original / ( ( Date.now() - startTime ) / 1000 ) ) / 1024 / 1024 ).toFixed( 2 ) + ' MB/s\n' +
						'\n'
					);
			}
		);
}



try
{
	runCli();
}
catch( err )
{
    console.error( 'Oh no! ' + err.message );
	process.exit( 1 );
}

