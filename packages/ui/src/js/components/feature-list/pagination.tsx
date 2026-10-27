import {Fragment, useEffect, useRef} from "react";
import {useDispatch} from "react-redux";

import {announceStatus} from "../../helpers/announce-status";
import {translate} from "../../helpers/i18n";
import {setListPage} from "../../store/actions";

function ariaLabelBuilder(page: number, isSelected: boolean) {
	const label = translate(
		isSelected
			? "ui.pagination.goToSelectedPageLabel"
			: "ui.pagination.goToPageLabel",
	);
	return label.replace("{page}", String(page));
}

// Keep two margin pages and three pages around the current page. Fill a
// one-page gap with its number rather than an unnecessary jump control.
function visiblePages(page: number, count: number) {
	const start = Math.max(0, Math.min(page - 1, count - 3));
	const pages = new Set([
		0,
		1,
		count - 2,
		count - 1,
		start,
		start + 1,
		start + 2,
	]);
	const sorted = [...pages]
		.filter((p) => p >= 0 && p < count)
		.sort((a, b) => a - b);
	return sorted.flatMap((p, index) =>
		p - (sorted[index - 1] ?? p) === 2 ? [p - 1, p] : [p],
	);
}

function Pagination({page, count}: {page: number; count: number}) {
	const dispatch = useDispatch();
	const currentPage = Math.max(0, Math.min(page, count - 1));
	const previousPage = useRef(currentPage);

	useEffect(() => {
		// Keep the rendered list on the same valid page as its controls when
		// filtering or a source update reduces the page count.
		if (page !== currentPage) {
			dispatch(setListPage(currentPage));
		}
	}, [page, currentPage, dispatch]);

	useEffect(() => {
		if (previousPage.current === currentPage) {
			return;
		}
		if (count === 0) {
			previousPage.current = currentPage;
			return;
		}
		const timer = setTimeout(() => {
			announceStatus(
				translate("ui.pagination.status")
					.replace("{n}", String(currentPage + 1))
					.replace("{total}", String(count)),
			);
			previousPage.current = currentPage;
		}, 300);
		return () => clearTimeout(timer);
	}, [currentPage, count]);

	function changePage(nextPage: number) {
		const next = Math.max(0, Math.min(nextPage, count - 1));
		if (count > 0 && next !== currentPage) {
			dispatch(setListPage(next));
		}
	}

	const pages = visiblePages(currentPage, count);
	const previousDisabled = count === 0 || currentPage === 0;
	const nextDisabled = count === 0 || currentPage === count - 1;

	return (
		<nav aria-label={translate("ui.pagination.label")}>
			<ul className="ms3-list-pagination">
				<li
					className={`ms3-list-pagination__page ms3-list-pagination__page--previous${previousDisabled ? " ms3-list-pagination__page--disabled" : ""}`}
				>
					<button
						type="button"
						className="ms3-list-pagination__page-link ms3-list-pagination__page-link--previous"
						aria-label={translate("ui.pagination.prevPageLabel")}
						aria-disabled={previousDisabled || undefined}
						tabIndex={previousDisabled ? -1 : undefined}
						onClick={() => changePage(currentPage - 1)}
					>
						{translate("ui.pagination.prevPage")}
					</button>
				</li>
				{pages.map((p, index) => {
					const selected = p === currentPage;
					const forward = p > currentPage;
					return (
						<Fragment key={p}>
							{p - (pages[index - 1] ?? p) > 1 ? (
								<li className="ms3-list-pagination__break">
									<button
										type="button"
										className="ms3-list-pagination__break-link"
										aria-label={translate(
											forward
												? "ui.pagination.jumpForward"
												: "ui.pagination.jumpBackward",
										)}
										onClick={() =>
											changePage(
												currentPage +
													(forward ? 3 : -3),
											)
										}
									>
										…
									</button>
								</li>
							) : null}
							<li
								className={`ms3-list-pagination__page${selected ? " ms3-list-pagination__page--active" : ""}`}
							>
								<button
									type="button"
									className={`ms3-list-pagination__page-link${selected ? " ms3-list-pagination__page-link--active" : ""}`}
									aria-label={ariaLabelBuilder(
										p + 1,
										selected,
									)}
									aria-current={selected ? "page" : undefined}
									onClick={() => changePage(p)}
								>
									{p + 1}
								</button>
							</li>
						</Fragment>
					);
				})}
				<li
					className={`ms3-list-pagination__page ms3-list-pagination__page--next${nextDisabled ? " ms3-list-pagination__page--disabled" : ""}`}
				>
					<button
						type="button"
						className="ms3-list-pagination__page-link ms3-list-pagination__page-link--next"
						aria-label={translate("ui.pagination.nextPageLabel")}
						aria-disabled={nextDisabled || undefined}
						tabIndex={nextDisabled ? -1 : undefined}
						onClick={() => changePage(currentPage + 1)}
					>
						{translate("ui.pagination.nextPage")}
					</button>
				</li>
			</ul>
		</nav>
	);
}

export default Pagination;
