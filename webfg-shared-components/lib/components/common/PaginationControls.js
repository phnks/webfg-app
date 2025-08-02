import React from 'react';
import './PaginationControls.css';
const PaginationControls = ({
  hasNextPage,
  onNext,
  onPrevious,
  onPageSizeChange,
  pageSize = 10,
  currentItemCount = 0,
  isLoading = false,
  hasPreviousPage = false
}) => {
  const pageSizeOptions = [10, 25, 50, 100];
  return /*#__PURE__*/React.createElement("div", {
    className: "pagination-controls"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pagination-info"
  }, /*#__PURE__*/React.createElement("span", {
    className: "item-count"
  }, currentItemCount, " items"), /*#__PURE__*/React.createElement("div", {
    className: "page-size-selector"
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: "page-size"
  }, "Items per page:"), /*#__PURE__*/React.createElement("select", {
    id: "page-size",
    value: pageSize,
    onChange: e => onPageSizeChange(parseInt(e.target.value)),
    disabled: isLoading,
    className: "page-size-select"
  }, pageSizeOptions.map(size => /*#__PURE__*/React.createElement("option", {
    key: size,
    value: size
  }, size))))), /*#__PURE__*/React.createElement("div", {
    className: "pagination-buttons"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onPrevious,
    disabled: !hasPreviousPage || isLoading,
    className: "pagination-btn previous"
  }, "\u2190 Previous"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onNext,
    disabled: !hasNextPage || isLoading,
    className: "pagination-btn next"
  }, "Next \u2192")));
};
export default PaginationControls;