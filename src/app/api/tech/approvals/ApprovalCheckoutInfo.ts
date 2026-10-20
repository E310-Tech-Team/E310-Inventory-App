export interface ApprovalCheckoutInfo {
    id: string;
    item_id: string;
    assigned_to_name: string;
    assigned_to_email: string;
    assigned_to_phone: string;
    condition_on_collection: string;
    collection_notes: string | null;
    date_collected: string;
    status: string;
}
