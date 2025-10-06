
export default function ApplicationLogo(props) {
    return (
        <img
            {...props}
            src="/storage/image/logo.jpg"   // make sure the image exists in your public/images/ folder
            alt="Application Logo"
        />
    );
}
