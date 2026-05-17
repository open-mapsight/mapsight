import ReactPaginate from "react-paginate";
import {useDispatch} from "react-redux";

import {translate} from "../../helpers/i18n";
import {setListPage} from "../../store/actions";

function ariaLabelBuilder(page: number, selected: number) {
	const label =
		page === selected
			? translate("ui.pagination.goToSelectedPageLabel")
			: translate("ui.pagination.goToPageLabel");

	return label.replace("{page}", String(page));
}

function Pagination({page, count}: {page: number; count: number}) {
	const dispatch = useDispatch();

	return null;

	return (
		<ReactPaginate
			disableInitialCallback={true}
			forcePage={Math.min(page, count)}
			pageCount={count}
			onPageChange={(e) => {
				dispatch(setListPage(e.selected));
			}}
			pageRangeDisplayed={3}
			marginPagesDisplayed={2}
			previousLabel={translate("ui.pagination.prevPage")}
			nextLabel={translate("ui.pagination.nextPage")}
			previousAriaLabel={translate("ui.pagination.prevPageLabel")}
			nextAriaLabel={translate("ui.pagination.nextPageLabel")}
			ariaLabelBuilder={ariaLabelBuilder}
			// TODO:
			// Handle deep urls (maybe also SSR)
			//hrefBuilder={hrefBuilder}

			eventListener="onClick"
			containerClassName="ms3-list-pagination"
			pageClassName="ms3-list-pagination__page"
			pageLinkClassName="ms3-list-pagination__page-link"
			previousClassName="ms3-list-pagination__page ms3-list-pagination__page--previous"
			previousLinkClassName="ms3-list-pagination__page-link ms3-list-pagination__page-link--previous"
			nextClassName="ms3-list-pagination__page ms3-list-pagination__page--next"
			nextLinkClassName="ms3-list-pagination__page-link ms3-list-pagination__page-link--next"
			activeClassName="ms3-list-pagination__page--active"
			activeLinkClassName="ms3-list-pagination__page-link--active"
			disabledClassName="ms3-list-pagination__page--disabled"
			breakClassName="ms3-list-pagination__break"
			breakLinkClassName="ms3-list-pagination__break-link"
		/>
	);
}

export default Pagination;
