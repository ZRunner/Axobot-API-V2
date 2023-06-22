interface CrowdinFileAddedEvent {
    event: 'file.added';
    file: CrowdinFile;
    user: CrowdinUser;
}

interface CrowdinFileFullyTranslatedEvent {
    event: 'file.translated';
    file: CrowdinFile;
    targetLanguage: {
        id: string;
        name: string;
        editorCode: string;
        twoLettersCode: string;
        threeLettersCode: string;
        locale: string;
        androidCode: string;
        osxCode: string;
        osxLocale: string;
        textDirection: string;
        dialectOf: null;
    }
}

interface CrowdinFileUpdatedEvent {
    event: 'file.updated';
    file: CrowdinFile;
    user: CrowdinUser;
}

interface CrowdinSourceStringAddedEvent {
    event: 'string.added';
    string: CrowdinString;
    user: CrowdinUser;
}

interface CrowdinSourceStringUpdatedEvent {
    event: 'string.updated';
    string: CrowdinString;
    user: CrowdinUser;
}

interface CrowdinSourceStringDeletedEvent {
    event: 'string.deleted';
    string: CrowdinString;
    user: CrowdinUser;
}