single % vs double %%

Use case:
	% used to input
	%% used to call registers

if u r using q for vectors then use same if u use another thing then asm will bugged it out

dont use ; inside asm its comment and compiler might get confused becus of it

for this like:
	result_a*result_b
	we cannot do it directly
	so we normally do haddps if pc supports it
	else we do movhlps and then add


why we have to use . and -> it was becus of pointer vs non pointer