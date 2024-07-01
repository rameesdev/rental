const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const SERVICE_ACCOUNT_KEY_FILE = path.join('./driveKey.json');

const auth = new google.auth.GoogleAuth({
  keyFile: SERVICE_ACCOUNT_KEY_FILE,
  scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

// async function createFolder(folderName, userEmail) {
//   const fileMetadata = {
//     'name': folderName,
//     'mimeType': 'application/vnd.google-apps.folder'
//   };
//   const response = await drive.files.create({
//     resource: fileMetadata,
//     fields: 'id'
//   });
//   const folderId = response.data.id;

//   // Share the folder with your personal Google account
//   await drive.permissions.create({
//     fileId: folderId,
//     resource: {
//       role: 'writer',
//       type: 'user',
//       emailAddress: userEmail
//     }
//   });
// console.log(response.data)
//   return folderId;
// }

async function uploadFile(filePath, folderId, fileName,mimeType) {
  const fileMetadata = {
    'name': fileName,
    parents: [folderId]
  };
  const media = {
    mimeType: mimeType||'image/jpeg', // Adjust mimeType as needed
    body: fs.createReadStream(filePath)
  };
  const response = await drive.files.create({
    resource: fileMetadata,
    media: media,
    fields: 'id, webViewLink, webContentLink'
  });
  return response.data;

}
async function createFolder(folderName, parentFolderId) {
  try {
    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId],
    };

    const folder = await drive.files.create({
      resource: fileMetadata,
      fields: 'id',
    });
    return folder.data;

  
  } catch (error) {
    console.error(`Error creating folder: ${error}`);
  }
}
async function getFile(fileId) {
  try {
      const response = await drive.files.get({
          fileId: fileId,
          alt: 'media',
      }, { responseType: 'arraybuffer' });

      return response.data;

  } catch (error) {
      console.error('Error retrieving file:', error);
      throw error; // Propagate the error back to the caller
  }
}



module.exports = {
  createFolder,
  uploadFile,
  getFile
};
