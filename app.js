const SUBMIT_ENDPOINT = 'https://your-endpoint.apigateway.us-ashburn-1.oci.customer-oci.com/submit/';
let memoUUID

function query(selector) {
    return document.querySelector(selector)
}

const video = query('#video')
const requestMediaStreamBtn = query('#request-media-stream-btn')
const getScreenshotFromMediaStreamBtn = query('#get-screenshot-from-media-stream-btn')
let screenCamCaptureBlobUrl = null;
let screenCamCaptureBlob


const resetFields = () => {
    document.getElementById('timestamp').value = new Date().toISOString().slice(0, 16); // Local datetime format for input
    navigator.geolocation.getCurrentPosition(function (position) {
        document.getElementById('latitude').value = position.coords.latitude;
        document.getElementById('longitude').value = position.coords.longitude;
    });
    document.getElementById('label').value=null
    document.getElementById('description').value=null
    document.getElementById('picture').value=null
    document.getElementById('screen-cam-capture').style.display = 'none'
    screenCamCaptureBlobUrl = null
    screenCamCaptureBlob = null
}

const submitData = () => {
    memoUUID = crypto.randomUUID();
    const memo = {}
    memo.timestamp = document.getElementById('timestamp').value || new Date().toISOString()
    memo.latitude = document.getElementById('latitude').value;
    memo.longitude = document.getElementById('longitude').value;
    memo.label = document.getElementById('label').value;
    memo.description = document.getElementById('description').value;

    fetch(SUBMIT_ENDPOINT, {
        method: 'PUT',
        headers: {
            'X-Client-Secret': 'YourClientSecretHere'
            , 'file-name': `memo-${memoUUID}.json`
            , 'Content-Type': 'application/json'
        },
        body: JSON.stringify(memo)
    })
        .then(response => response.status)
        .then(data => {
            submitPicture()
            if (screenCamCaptureBlob) {
                submitBlob(screenCamCaptureBlob, `memo-camcapture-${memoUUID}.jpeg`, 'image/jpeg')
            }        
            resetFields()
        })        
        .catch(error => alert('Error submitting data: ' + error.message));
};


const submitPicture = () => {
    const fileInput = document.getElementById('picture');
    const file = fileInput.files[0]; // Get the first file from the file input

    if (file) {
        // get extension of file 
        const extension = file.name.split('.').pop();
        submitBlob(file, `memo-picture-${memoUUID}.` + extension, file.type)

        // const fetchOptions = {
        //     method: 'PUT',
        //     body: file, // Directly use the file Blob from the input
        //     headers: {
        //         'Content-Type': file.type // Optional: Set the content type based on the file
        //         , 'X-Client-Secret': 'YourClientSecretHere'
        //         , 'file-name': `memo-picture-${memoUUID}.` + extension

        //     }
        // };

        // fetch(SUBMIT_ENDPOINT, fetchOptions)
        //     .then(response => {
        //         if (!response.ok) {
        //             throw new Error('Network response was not ok: ' + response.statusText);
        //         }
        //         return response.status;
        //     })
        //     .then(data => {
        //         console.log('Success uploading picture:', data);
        //     })
        //     .catch(error => {
        //         console.error('Error:', error);
        //     });
    }
}
// Buttons

requestMediaStreamBtn.addEventListener('click', event => {
    requestCamAndStreamInVideo(video)
})

getScreenshotFromMediaStreamBtn.addEventListener('click', async event => {
    screenCamCaptureBlob = await captureScreenshotFromMediaStream(video.srcObject)

    screenCamCaptureBlobUrl = URL.createObjectURL(screenCamCaptureBlob)
    // show captured image in img screen-cam-capture
    document.getElementById('screen-cam-capture').src = screenCamCaptureBlobUrl
    // display block
    document.getElementById('screen-cam-capture').style.display = 'block'


})

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('timestamp').value = new Date().toISOString().slice(0, 16); // Local datetime format for input
    navigator.geolocation.getCurrentPosition(function (position) {
        document.getElementById('latitude').value = position.coords.latitude;
        document.getElementById('longitude').value = position.coords.longitude;
    });
});



// Functions

const submitBlob = (blob, filename, contentType) => {
    const fetchOptions = {
        method: 'PUT',
        headers: {
            'X-Client-Secret': 'YourClientSecretHere'
            , 'file-name': filename
            , 'Content-Type': contentType
        },
        body: blob,
    };

    fetch(SUBMIT_ENDPOINT, fetchOptions)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.status;
        })
        .then(data => {
            console.log('Success:', data);
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

async function requestCamAndStreamInVideo(video) {
    const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true })

    if (video && video instanceof HTMLVideoElement) {
        video.srcObject = mediaStream
        getScreenshotFromMediaStreamBtn.style.display = 'block'
    }
}

async function captureScreenshotFromMediaStream(mediaStream) {
    if (!mediaStream || !(mediaStream instanceof MediaStream)) return
    const imageCapture = new ImageCapture(mediaStream.getVideoTracks()[0])
    const blob = await imageCapture.takePhoto()
    return blob
}
