/**
 * External dependencies
 */
import React, { PureComponent } from 'react';
import { withRouter } from 'react-router';
import debugModule from 'debug';
import apiFetch from '@wordpress/api-fetch';
import { Button, CheckboxControl } from '@wordpress/components';
import { withSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
// @TODO: is this the correct way to handle styles?
import './style.scss';
import AuthorSelector from './author-selector';

const debug = debugModule( 'unfied-importer:author-mapping' );

class AuthorMapping extends PureComponent {
	state = {
		isImporting: false,
		authors: {},
		fetchAttachments: false,
	};

	doImport = () => {
		const { authors, fetchAttachments } = this.state;

		this.setState( { isImporting: true }, () => {
			apiFetch( {
				method: 'POST',
				path: '/wordpress-importer/v1/start',
				data: {
					authors,
					fetch_attachments: fetchAttachments,
				},
			} )
				.then( response => {
					this.setState( { isImporting: false } );
					debug( response );
					window.location = '#/complete';
				} )
				.catch( error => {
					this.setState( { isImporting: false } );
					debug( error );
				} );
		} );
	};

	authorChangeHandler = ( key, value ) => {
		this.setState( ( { authors } ) => ( {
			authors: {
				...authors,
				[ key ]: value,
			},
		} ) );
	};

	onCheckboxChange = fetchAttachments => this.setState( { fetchAttachments } );

	// @TODO: this feels... hacky :/
	static getDerivedStateFromProps( props, state ) {
		const { importAuthors } = props;
		const importAuthorDefaults = importAuthors
			.map( author => author.author_login )
			.reduce( ( obj, author ) => {
				return { ...obj, [ author ]: author };
			}, {} );

		return { authors: { ...importAuthorDefaults, ...state.authors } };
	}

	render() {
		const { importAuthors, siteAuthors } = this.props;

		if ( ! siteAuthors.length ) {
			return <div>{ __( 'Loading...' ) }</div>;
		}

		return (
			<div>
				<h2>{ __( 'Import WordPress' ) }</h2>
				<div>
					{ __( 'To make it easier for you to edit and save the imported content, you may want to reassign the author of the imported item to an existing user of this site. For example, you may want to import all the entries as admins entries.' ) }
				</div>
				<div>
					{ __( `If a new user is created by WordPress, a new password will be randomly generated and the new user’s role will be set as subscriber. Manually changing the new user’s details will be necessary.` ) }
				</div>

				<h3>{ __( 'Assign Authors' ) }</h3>

				<ol>
					{ importAuthors.map( importAuthor => {
						return (
							<li
								key={ `author_${ importAuthor.author_login }` }
								className="wordpress-importer__author-selector"
							>
								{ __( 'Import author:' ) } { importAuthor.author_display_name } ({ importAuthor.author_login })
								<AuthorSelector
									importAuthor={ importAuthor }
									siteAuthors={ siteAuthors }
									onChange={ this.authorChangeHandler }
									value={ '' }
								/>
							</li>
						);
					} ) }
				</ol>

				<h3>{ __( 'Import Attachments' ) }</h3>

				<CheckboxControl
					label={ __( 'Download and import file attachments' ) }
					checked={ this.state.fetchAttachments }
					onChange={ this.onCheckboxChange }
				/>

				<div className="wordpress-importer__div-actions">
					{ this.state.isImporting ? (
						<div>{ __( 'Importing...' ) }</div>
					) : (
						<Button isPrimary onClick={ this.doImport }>
							{ __( 'Start Import' ) }
						</Button>
					) }
				</div>
			</div>
		);
	}
}

export default withSelect( select => {
	return {
		siteAuthors: select( 'core' ).getAuthors(),
		importAuthors: select( 'wordpress-importer' ).getImportAuthors(),
	};
} )( withRouter( AuthorMapping ) );