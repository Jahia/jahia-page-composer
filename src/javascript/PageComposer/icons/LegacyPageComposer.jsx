import * as React from 'react';
import PropTypes from 'prop-types';

const SvgLegacyPageComposer = ({size, className, color, ...otherProps}) => {
    const props = Object.assign(
        {},
        {
            size,
            className,
            ...otherProps
        }
    );
    const classNameColor = color ? ' moonstone-icon_' + color : '';
    props.className =
        className + ' moonstone-icon moonstone-icon_' + size + classNameColor;
    return (
        <svg
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            {...props}
        >
            <path fillRule="evenodd" clipRule="evenodd" d="M14.0004 2H6.00037C4.90037 2 4.00037 2.9 4.00037 4V20C4.00037 21.1 4.89037 22 5.99037 22H18.0004C19.1004 22 20.0004 21.1 20.0004 20V15.3461L18.0004 17.3461V20H6.00037V4H13.0004V9H16.3911L18.6957 6.69536L14.0004 2ZM19.7471 8.47846L19.7501 8.47545L21.8993 10.6247L15.5605 16.9635H15.5545H13.4113H13.4052V15H13.4113V14.8143L15.2255 13H15.2195L16.0004 12.2191V12.2252L18.0004 10.2252V10.2191L19.7441 8.47545L19.7471 8.47846ZM8.00037 11H14.3911L12.3911 13H8.00037V11ZM8.00037 15H11.4052V17H8.00037V15ZM14.6278 7.32814V5.10474L16.7338 7.32814H14.6278ZM22.2203 6.81337C21.9968 6.58985 21.6357 6.58985 21.4122 6.81337L20.3633 7.8622L22.5126 10.0114L23.5614 8.96261C23.7849 8.73909 23.7849 8.37801 23.5614 8.15449L22.2203 6.81337Z"/>
        </svg>
    );
};

SvgLegacyPageComposer.propTypes = {
    size: PropTypes.string,
    className: PropTypes.string,
    color: PropTypes.string
};

export default SvgLegacyPageComposer;
