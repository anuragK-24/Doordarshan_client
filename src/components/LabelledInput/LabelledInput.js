import React from "react";
import PropTypes from "prop-types";
import "./LabelledInput.scss";

export default function LabelledInput({
  label,
  placeholder,
  value,
  type,
  onChange,
  error,
}) {
  return (
    <div className="LabelledInput">
      {label && <div className="LabelledInput__Label">{label}</div>}
      <input
        className="LabelledInput__Input"
        type={type}
        placeholder={placeholder}
        onChange={onChange}
        value={value}
        required
      ></input>
      {error && error.error && (
        <div className="LabelledInput__Error">{error.msg}</div>
      )}
    </div>
  );
}

LabelledInput.propTypes = {
  label: PropTypes.string,
  placeholder: PropTypes.string,
  type: PropTypes.string,
  value: PropTypes.string,
  onChange: () => {},
  error: PropTypes.object,
};

LabelledInput.defaultProps = {
  label: "",
  placeholder: "",
  type: "text",
  value: "",
  bool: {},
};
