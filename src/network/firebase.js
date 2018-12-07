import Firebase from 'firebase'

const firebaseApp = Firebase.initializeApp({
    apiKey: "AIzaSyAvOjVb9-SwCFiWGDr1L9_PGz1Ei-1FVDc",
    authDomain: "author2018-53022.firebaseapp.com",
    databaseURL: "https://author2018-53022.firebaseio.com",
    projectId: "author2018-53022",
    storageBucket: "author2018-53022.appspot.com",
    messagingSenderId: "515142910133"
});

export const db = firebaseApp.database();