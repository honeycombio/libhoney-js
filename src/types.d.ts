declare module 'libhoney' {
    //Module used instead of namespace because of need to export as a package
    //Namespace *maybe* will also be used.
    type FieldValue = string | number | undefined | null;
    type DynamicFieldValue = () => FieldValue;
    type Fields = Record<string, FieldValue>;
    type DynamicFields = Record<string, DynamicFieldValue>;

    type LibhoneyOptions = {
        writeKey: string;
        dataset: string;
      };

    //Create events easily and send them to Honeycomb.
    class Libhoney {
        public sampleRate: number;
        public dataset: number;
        public writeKey: string;
        public apiHost: string;

        constructor(options: LibhoneyOptions);
        add: Builder['add'];
        addField: Builder['addField'];
        addDynamicField: Builder['addDynamicField'];
        sendNow: Builder['sendNow'];
        newEvent: Builder['newEvent'];
        newBuilder: Builder['newBuilder'];
        /**
        * Allows you to easily wait for everything to be sent to Honeycomb (and for responses to come back for
        * events). Also initializes a transmission instance for libhoney to use, so any events sent
        * after a call to flush will not be waited on.
        */
        flush(): Promise<void>;
    }
    export default Libhoney;
    //Individual Event to be sent.
    class Event {
        public timestamp: string;
        public data: Fields;

        constructor(libhoney: Libhoney, fields: Fields, dynamicFields: DynamicFields);
        add(data: Fields): void;
        addField(name: string, value: FieldValue): Event;
        addMetadata(md: Record<string, string>): Event;
        send(): void;
        sendPresampled(): void;
    }
    // Allows piecemeal creation of events.
    class Builder {
        constructor(libhoney: Libhoney, fields: Fields, dynamicFields: DynamicFields);
        add(fields: Fields & DynamicFields): Builder;
        addField(name: string, value: FieldValue): Builder;
        addDynamicField(name: string, dynamicFieldValue: DynamicFieldValue): Builder;
        sendNow(fields: Fields & DynamicFields): void;
        newEvent(): Event;
        newBuilder(fields: Fields, dynamicFields?: DynamicFields): Builder;

    }


}