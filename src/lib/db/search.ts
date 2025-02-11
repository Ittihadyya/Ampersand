
import { shallowRef, Ref, ShallowRef, watch } from "vue";
import { Member, Tag, FrontingEntry, FrontingEntryComplete, BoardMessage, BoardMessageComplete } from "./entities";
import { parseBoardMessageFilterQuery, parseFrontingHistoryFilterQuery, parseMemberFilterQuery } from "../util/filterQuery";
import dayjs from "dayjs";
import { toBoardMessageComplete } from "./tables/boardMessages";
import { toFrontingEntryComplete } from "./tables/frontingEntries";
import { appConfig } from "../config";

export function getFilteredMembers(search: Ref<string>, members: ShallowRef<Member[]>){
	const _members = shallowRef<Member[]>([]);

	watch([
		search,
		members,
	], async () => {
		let query: string;
		if(!search.value.length)
			query = appConfig.defaultFilterQueries.members || "";
		else
			query = search.value;

		const parsed = await parseMemberFilterQuery(query);

		_members.value = members.value.filter(x => {

			if(parsed.all)
				return true;

			if (!x.name.toLowerCase().startsWith(parsed.query.toLowerCase()))
				return false;

			if (parsed.pronouns) {
				if (!x.pronouns || x.pronouns.toLowerCase() !== parsed.pronouns.toLowerCase())
					return false;
			}

			if (parsed.role) {
				if (!x.role || x.role.toLowerCase() !== parsed.role.toLowerCase())
					return false;
			}

			if (parsed.isArchived !== undefined) {
				if (x.isArchived !== parsed.isArchived)
					return false;
			}

			if (parsed.isCustomFront !== undefined) {
				if (x.isCustomFront !== parsed.isCustomFront)
					return false;
			}

			if (parsed.tags.length) {
				for (const uuid of parsed.tags) {
					if (!x.tags.includes(uuid))
						return false;
				}
			}

			return true;
		});
	}, { immediate: true });

	return _members;
}

export function getFilteredTags(search: Ref<string>, type: Ref<string>, tags: ShallowRef<Tag[]>) {
	const _tags = shallowRef<Tag[]>([]);

	watch([
		search,
		type,
		tags
	], async () => {
		let query: string;

		if (!search.value.length)
			query = appConfig.defaultFilterQueries.tags || "";
		else
			query = search.value;


		if(!query.length)
			_tags.value = tags.value.filter(x => x.type === type.value);
		else
			_tags.value = tags.value.filter(x => x.name.toLowerCase().startsWith(query.toLowerCase()) && x.type === type.value);
	}, { immediate: true });

	return _tags;
}

export function getFilteredFrontingEntries(search: Ref<string>, frontingEntries: ShallowRef<FrontingEntry[]>){
	const _frontingEntries = shallowRef<FrontingEntryComplete[]>([]);

	watch([
		search,
		frontingEntries
	], async () => {
		const filtered: FrontingEntryComplete[] = [];
		let query: string;

		if(!search.value.length)
			query = appConfig.defaultFilterQueries.frontingHistory || "";
		else
			query = search.value;

		if(!query.length){
			for (const x of frontingEntries.value)
				filtered.push(await toFrontingEntryComplete(x))
		} else {
			const parsed = parseFrontingHistoryFilterQuery(query);

			for (const x of frontingEntries.value) {
				const complete = await toFrontingEntryComplete(x);

				if (parsed.all){
					filtered.push(complete);
					continue;
				}

				if (!complete.member.name.toLowerCase().startsWith(parsed.query.toLowerCase()))
					continue;

				if (parsed.member) {
					if (x.member !== parsed.member)
						continue;
				}

				if (parsed.currentlyFronting) {
					if (x.endTime)
						continue;
				}

				if (parsed.startDateString) {
					const date = dayjs(parsed.startDateString).startOf("day");
					if (date.valueOf() !== dayjs(x.startTime).startOf("day").valueOf())
						continue;
				}

				if (parsed.endDateString) {
					const date = dayjs(parsed.endDateString).startOf("day");
					if (date.valueOf() !== dayjs(x.endTime).startOf("day").valueOf())
						continue;
				}

				if (parsed.startDay) {
					if (parsed.startDay !== dayjs(x.startTime).get("date"))
						continue;
				}

				if (parsed.endDay) {
					if (parsed.endDay !== dayjs(x.endTime).get("date"))
						continue;
				}

				if (parsed.startMonth) {
					if (parsed.startMonth !== dayjs(x.startTime).get("month") + 1)
						continue;
				}

				if (parsed.endMonth) {
					if (parsed.endMonth !== dayjs(x.endTime).get("month") + 1)
						continue;
				}

				if (parsed.startYear) {
					if (parsed.startYear !== dayjs(x.startTime).get("year"))
						continue;
				}

				if (parsed.endYear) {
					if (parsed.endYear !== dayjs(x.endTime).get("year"))
						continue;
				}

				filtered.push(complete)
			}
		}

		_frontingEntries.value = filtered;
	}, { immediate: true });

	return _frontingEntries;
}

export function getFilteredBoardMessages(search: Ref<string>, boardMessages: ShallowRef<BoardMessage[]>) {
	const _boardMessages = shallowRef<BoardMessageComplete[]>([]);

	watch([
		search,
		boardMessages
	], async () => {
		const filtered: BoardMessageComplete[] = [];

		let query: string;

		if (!search.value.length)
			query = appConfig.defaultFilterQueries.messageBoard || "";
		else
			query = search.value;


		if (!query.length) {
			for (const x of boardMessages.value)
				filtered.push(await toBoardMessageComplete(x))
		} else {
			const parsed = parseBoardMessageFilterQuery(query);

			for (const x of boardMessages.value) {
				const complete = await toBoardMessageComplete(x);

				if (parsed.all) {
					filtered.push(complete);
					continue;
				}

				if (
					![
						x.title.toLowerCase().split(" "),
						complete.member.name.toLowerCase().split(" ")
					].flat().find(x => x.startsWith(parsed.query.toLowerCase()))
				)
					continue;

				if (parsed.member) {
					if (x.member !== parsed.member)
						continue;
				}

				if (parsed.dateString) {
					const date = dayjs(parsed.dateString).startOf("day");
					if (date.valueOf() !== dayjs(x.date).startOf("day").valueOf())
						continue;
				}

				if (parsed.day) {
					if (parsed.day !== dayjs(x.date).get("date"))
						continue;
				}

				if (parsed.month) {
					if (parsed.month !== dayjs(x.date).get("month") + 1)
						continue;
				}

				if (parsed.year) {
					if (parsed.year !== dayjs(x.date).get("year"))
						continue;
				}

				filtered.push(complete)
			}
		}

		_boardMessages.value = filtered;
	}, { immediate: true });

	return _boardMessages;
}
