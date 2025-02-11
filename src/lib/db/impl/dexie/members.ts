import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../../events";
import { makeUUIDv5 } from "../../../util/uuid";
import { UUIDable, Member, UUID } from "../../entities";
import { getSystemUUID } from "./system";

export function getMembers(){
	return db.members.toArray();
}

async function genid(name: string) {
	return makeUUIDv5((await getSystemUUID())!, `members\0${name}\0${Date.now()}`);
}

export async function newMember(member: Omit<Member, keyof UUIDable>) {
	try{
		const uuid = await genid(member.name);
		await db.members.add({
			...member,
			uuid
		});
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "members",
			event: "new",
			data: uuid
		}));
		return true;
	}catch(error){
		return false;
	}
}

export async function removeMember(uuid: UUID) {
	try {
		await db.members.delete(uuid);
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "members",
			event: "deleted",
			data: uuid
		}));
		return true;
	} catch (error) {
		return false;
	}
}

export async function updateMember(uuid: UUID, newContent: Partial<Member>) {
	try{
		const updated = await db.members.update(uuid, newContent);
		if(updated) {
			DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
				table: "members",
				event: "modified",
				data: uuid
			}));
			return true;
		}
		return false;
	}catch(error){
		return false;
	}
}