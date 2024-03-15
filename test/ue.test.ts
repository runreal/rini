import { assertEquals } from 'std/assert/mod.ts'
import * as path from 'std/path/mod.ts'
import * as ini from '../mod.ts'

const fixture1 = path.resolve('./test/fixtures/ue1.ini')
const fixture2 = path.resolve('./test/fixtures/ue2.ini')
const data1 = Deno.readTextFileSync(fixture1)
const data2 = Deno.readTextFileSync(fixture2)

const expectA = `[/Script/EngineSettings.GeneralProjectSettings]
ProjectID=projectidprojectprojectid
ProjectDisplayedTitle=NSLOCTEXT("[/Script/EngineSettings]", "fafafafafafa", "gamename")
ProjectName=gamename
CopyrightNotice=Games Inc 2018
CompanyName=Games Inc.
Homepage=www.github.com
ProjectVersion=0.0.0

[/Script/GameplayTriggers.GameplayTriggersManager]
AllowedTriggerTypeRootTags=(TagName="Trigger")
+AllowedTriggerTypeRootTags=(TagName="Action1")
+AllowedTriggerTypeRootTags=(TagName="Action2")
+AllowedTriggerTypeRootTags=(TagName="Action3")

[/Script/GameplayAbilities.AbilitySystemGlobals]
-MapsToCook=(FilePath="/Game/Game/Maps/Menu/Menu_Home")
+DirectoriesToAlwaysCook=(Path="Movies")
+DirectoriesToAlwaysCook=(Path="Game/Blueprints/Cues")
`

const expectB = {
	'/Script/EngineSettings.GeneralProjectSettings': {
		ProjectID: 'projectidprojectprojectid',
		ProjectDisplayedTitle: 'NSLOCTEXT("[/Script/EngineSettings]", "fafafafafafa", "gamename")',
		ProjectName: 'gamename',
		CopyrightNotice: 'Copyright Games Inc 2018',
		CompanyName: 'Games Inc.',
		Homepage: 'www.github.com',
		ProjectVersion: '0.0.0',
	},
	'/Script/GameplayTriggers.GameplayTriggersManager': {
		AllowedTriggerTypeRootTags: '(TagName="Trigger")',
		'+AllowedTriggerTypeRootTags': [
			'(TagName="Action1")',
			'(TagName="Action2")',
			'(TagName="Action3")',
		],
	},
	'/Script/GameplayAbilities.AbilitySystemGlobals': {
		AbilitySystemGlobalsClassName: '/Script/SystemGlobals',
		GlobalGameplayCueManagerClass: '/Script/CueManager',
		GameplayCueNotifyPaths: '/Game/Blueprints/Cues',
		GlobalAttributeSetDefaultsTableNames:
			'/Game/Data/Gameplay/Attributes/CT_Attributes_Defaults.CT_Attributes_Defaults',
		'+GlobalAttributeSetDefaultsTableNames': [
			'/Game/Data/Gameplay/Attributes/CT_Attributes_Character_Defaults.CT_Attributes_Character_Defaults',
			'/Game/Data/Gameplay/Attributes/CT_Attributes_Character_Player.CT_Attributes_Character_Player',
			'/Game/Data/Gameplay/Attributes/CT_Attributes_Character_Enemy.CT_Attributes_Character_Enemy',
		],
	},
	'/Script/APCombatCoordinator': {
		'+GlobalCooldownChannels': [
			'(Id="Channel.1",Duration=10,NumConcurrent=1)',
			'(Id="Channel.2",Duration=10,NumConcurrent=1)',
		],
	},
	'/Script/APAbilitySystemGlobals': {
		GlobalAttackOverrideTableNames: '/Game/Data/Gameplay/Attacks/CT_Attacks_Defaults.CT_Attacks_Defaults',
		'+GlobalAttackOverrideTableNames': [
			'/Game/Data/Gameplay/Attacks/CT_Attacks_Player.CT_Attacks_Player',
			'/Game/Data/Gameplay/Attacks/CT_Attacks_Enemy.CT_Attacks_Enemy',
			'/Game/Data/Gameplay/Attacks/CT_Attacks_Boss.CT_Attacks_Boss',
		],
		bAIIgnoresCost: false,
		StaminaCostCheckMax: '1.0f',
		bPlayersUseStaminaCostCheckMax: false,
		bAIUseStaminaCostCheckMax: true,
		ExhaustionDuration: '0.0f',
		'+ElementalDamageConfig': [
			`(Element=Fire,ElementalDamageEffect="/Game/Blueprints/Gameplay/Effects/ElementalDamage",ElementalItemSetEffect="/Game/Blueprints/Gameplay/Effects/ElementalDamage",ElementalShockEffect="/Game/Blueprints/Gameplay/Effects/ElementalDamage")`,
			`(Element=Lightning,ElementalDamageEffect="/Game/Blueprints/Gameplay/Effects/ElementalDamage",ElementalItemSetEffect="/Game/Blueprints/Gameplay/Effects/ElementalDamage",ElementalShockEffect="/Game/Blueprints/Gameplay/Effects/ElementalDamage")`,
			`(Element=Void,ElementalDamageEffect="/Game/Blueprints/Gameplay/Effects/ElementalDamage",ElementalItemSetEffect="/Game/Blueprints/Gameplay/Effects/ElementalDamage",ElementalShockEffect="/Game/Blueprints/Gameplay/Effects/ElementalDamage")`,
			`(Element=Holy,ElementalDamageEffect="/Game/Blueprints/Gameplay/Effects/ElementalDamage",ElementalItemSetEffect="/Game/Blueprints/Gameplay/Effects/ElementalDamage",ElementalShockEffect="/Game/Blueprints/Gameplay/Effects/ElementalDamage")`,
		],
	},
	'/Script/UnrealEd.ProjectPackagingSettings': {
		Build: 'IfProjectHasCode',
		ApplocalPrerequisitesDirectory: '(Path="")',
		'+MapsToCook': [
			'(FilePath="/Game/Maps/Development/Server")',
			'(FilePath="/Game/Maps/Menu/Menu_Home")',
		],
		'-MapsToCook': [
			'(FilePath="/Game/Developers/place")',
			'(FilePath="/Game/Maps/Menu/Menu_Home")',
		],
		'+DirectoriesToAlwaysCook': ['(Path="Movies")', '(Path="Blueprints/Cues")'],
	},
}

const expectC = `[/Script/VersionConfig]
API_URL="https://example.com/"
API_DEBUG=False
GameLiftSecret="secret"
`

const expectD = {
	'/Script/VersionConfig': {
		API_DEBUG: 'False',
		API_URL: '"https://example.com"',
		GameLiftSecret: '"secret"',
	},
}

Deno.test('decode from DefaultGame.ini file', () => {
	const d = ini.decode(data1, { splitSeperator: '*', bracketedArray: false })
	assertEquals(d, expectB)
})

Deno.test('encode DefaultGame.ini from data', () => {
	const decoded = ini.decode(expectA, {
		splitSeperator: '*',
		bracketedArray: false,
	})
	const e = ini.encode(decoded, {
		splitSeperator: '*',
		unsafe: true,
		bracketedArray: false,
		platform: 'linux',
	})
	assertEquals(e, expectA)
})

Deno.test('decode from DefaultVersionConfig.ini file', () => {
	const d = ini.decode(data2, { splitSeperator: '*', stripQuotes: false })
	assertEquals(d, expectD)
	assertEquals(d['/Script/VersionConfig'].API_DEBUG, 'False')
	assertEquals(d['/Script/VersionConfig'].API_URL, '"https://example.com"')
	assertEquals(d['/Script/VersionConfig'].GameLiftSecret, '"secret"')
})

Deno.test('encode from DefaultVersionConfig.ini file', () => {
	const d = ini.decode(expectC, { splitSeperator: '*', stripQuotes: false })
	const e = ini.encode(d, { unsafe: true, platform: 'linux' })
	assertEquals(e, expectC)
})
